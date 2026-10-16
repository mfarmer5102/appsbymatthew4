import {db, SCHEMA} from '../configuration/database.js';
import {error_config} from '../configuration/errors.js';
import {
    parse_optional_text,
    parse_optional_bool,
    parse_optional_int,
    parse_bool,
    parse_pagination,
    parse_sort,
    build_pagination,
} from '../_library/functions/query_params.js';

const SKILL_COLUMNS = `
    s.skill_key,
    s.skill,
    s.skill_type_key,
    st.skill_type,
    s.is_proficient,
    s.is_visible_in_app_details,
    s.is_hidden,
    s.provide_disclaimer,
    s.created_at,
    s.updated_at
`;

const SKILL_JOINS = `
    FROM ${SCHEMA}.dim_skill s
    JOIN ${SCHEMA}.dim_skill_type st ON st.skill_type_key = s.skill_type_key
`;

// $5 carries include_hidden: hidden skills stay out of the public listing unless a
// caller explicitly asks for them, which is what the admin UI does. $6 filters by the
// skill type's name rather than its key - how a caller that only knows names (the MCP
// get_skills tool) narrows the list.
const SKILL_FILTERS = `
    WHERE s.deleted_at IS NULL
      AND ($1::text    IS NULL OR s.skill = $1)
      AND ($2::int     IS NULL OR s.skill_type_key = $2)
      AND ($3::boolean IS NULL OR s.is_visible_in_app_details = $3)
      AND ($4::boolean IS NULL OR s.is_proficient = $4)
      AND ($5::boolean IS TRUE  OR s.is_hidden = false)
      AND ($6::text    IS NULL OR st.skill_type = $6)
`;

// ORDER BY cannot be parameterized, so the sort column is matched against this list
// before it is interpolated.
const SORTABLE_FIELDS = ['skill', 'skill_type', 'is_proficient', 'created_at', 'updated_at'];

const sort_expression = (field) => (field === 'skill_type' ? 'st.skill_type' : `s.${field}`);

function read_skill_body(body = {}) {
    const skill = parse_optional_text(body.skill);
    const skill_type_key = parse_optional_int(body.skill_type_key);

    if (!skill || skill_type_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    return {
        skill,
        skill_type_key,
        // All four flags are NOT NULL in the schema, so an omitted value has to become a
        // concrete boolean rather than null.
        is_proficient: parse_bool(body.is_proficient, false),
        is_visible_in_app_details: parse_bool(body.is_visible_in_app_details, true),
        is_hidden: parse_bool(body.is_hidden, false),
        provide_disclaimer: parse_bool(body.provide_disclaimer, false),
    };
}

function translate_write_error(error) {
    if (error.code === '23503') {
        return new Error(error_config.select_error('invalid_reference'));
    }
    return error;
}

export const do_get_many = async ({query = {}} = {}) => {
    const skill = parse_optional_text(query.skill);
    const skill_type_key = parse_optional_int(query.skill_type_key);
    const is_visible_in_app_details = parse_optional_bool(query.visible);
    const is_proficient = parse_optional_bool(query.proficient);
    const include_hidden = parse_bool(query.include_hidden, false);
    const skill_type = parse_optional_text(query.skill_type);

    const {limit, offset} = parse_pagination(
        query.limit,
        query.offset,
    );
    const {field, direction} = parse_sort(
        query.sort,
        query.order,
        SORTABLE_FIELDS,
        'skill',
    );

    const filter_params = [skill, skill_type_key, is_visible_in_app_details, is_proficient, include_hidden, skill_type];

    const {rows} = await db.query(
        `
        SELECT ${SKILL_COLUMNS}
        ${SKILL_JOINS}
        ${SKILL_FILTERS}
        ORDER BY ${sort_expression(field)} ${direction}, s.skill_key ASC
        LIMIT $7 OFFSET $8
        `,
        [...filter_params, limit, offset],
    );

    const {rows: count_rows} = await db.query(
        `SELECT COUNT(*) AS total ${SKILL_JOINS} ${SKILL_FILTERS}`,
        filter_params,
    );

    return {
        data: rows,
        pagination: build_pagination(count_rows[0].total, limit, offset, rows.length),
    };
};

export const do_create = async ({body: request_body = {}} = {}) => {
    const body = read_skill_body(request_body);

    try {
        const {rows} = await db.query(
            `
            INSERT INTO ${SCHEMA}.dim_skill
                (skill, skill_type_key, is_proficient, is_visible_in_app_details,
                 is_hidden, provide_disclaimer, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, now(), now())
            RETURNING skill_key
            `,
            [
                body.skill,
                body.skill_type_key,
                body.is_proficient,
                body.is_visible_in_app_details,
                body.is_hidden,
                body.provide_disclaimer,
            ],
        );

        return await select_skill(rows[0].skill_key);
    } catch (error) {
        throw translate_write_error(error);
    }
};

export const do_update = async ({body: request_body = {}} = {}) => {
    const skill_key = parse_optional_int(request_body.skill_key);
    if (skill_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const body = read_skill_body(request_body);

    try {
        const {rowCount} = await db.query(
            `
            UPDATE ${SCHEMA}.dim_skill
            SET skill                     = $2,
                skill_type_key            = $3,
                is_proficient             = $4,
                is_visible_in_app_details = $5,
                is_hidden                 = $6,
                provide_disclaimer        = $7,
                updated_at                = now()
            WHERE skill_key = $1
              AND deleted_at IS NULL
            `,
            [
                skill_key,
                body.skill,
                body.skill_type_key,
                body.is_proficient,
                body.is_visible_in_app_details,
                body.is_hidden,
                body.provide_disclaimer,
            ],
        );

        if (rowCount === 0) {
            throw new Error(error_config.select_error('skill_not_found'));
        }

        return await select_skill(skill_key);
    } catch (error) {
        throw translate_write_error(error);
    }
};

export const do_delete = async ({body = {}} = {}) => {
    const skill_key = parse_optional_int(body.skill_key);
    if (skill_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    // Soft delete leaves bridge_application_skill rows intact; the application
    // projection filters deleted skills out on read, so history is preserved without
    // tripping the foreign key.
    const {rowCount} = await db.query(
        `
        UPDATE ${SCHEMA}.dim_skill
        SET deleted_at = now(), updated_at = now()
        WHERE skill_key = $1
          AND deleted_at IS NULL
        `,
        [skill_key],
    );

    if (rowCount === 0) {
        throw new Error(error_config.select_error('skill_not_found'));
    }

    return {skill_key, deleted: true};
};

async function select_skill(skill_key) {
    const {rows} = await db.query(
        `SELECT ${SKILL_COLUMNS} ${SKILL_JOINS} WHERE s.skill_key = $1`,
        [skill_key],
    );
    return rows[0] ?? null;
}
