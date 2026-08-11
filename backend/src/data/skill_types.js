import {db, SCHEMA} from '../configuration/database.js';
import {error_config} from '../configuration/errors.js';
import {
    parse_optional_text,
    parse_optional_int,
    parse_pagination,
    build_pagination,
} from '../_library/functions/query_params.js';

const SKILL_TYPE_COLUMNS = `
    st.skill_type_key,
    st.skill_type,
    st.created_at,
    st.updated_at
`;

// INSERT and UPDATE have no table alias to qualify against, so RETURNING needs the
// bare column names.
const SKILL_TYPE_RETURNING = `skill_type_key, skill_type, created_at, updated_at`;

const SKILL_TYPE_FILTERS = `
    FROM ${SCHEMA}.dim_skill_type st
    WHERE st.deleted_at IS NULL
      AND ($1::text IS NULL OR st.skill_type = $1)
`;

export const do_get_many = async (req_objx) => {
    const skill_type = parse_optional_text(req_objx.get_query_string_param('skill_type'));
    const {limit, offset} = parse_pagination(
        req_objx.get_query_string_param('limit'),
        req_objx.get_query_string_param('offset'),
    );

    const filter_params = [skill_type];

    const {rows} = await db.query(
        `
        SELECT ${SKILL_TYPE_COLUMNS}
        ${SKILL_TYPE_FILTERS}
        ORDER BY st.skill_type ASC
        LIMIT $2 OFFSET $3
        `,
        [...filter_params, limit, offset],
    );

    const {rows: count_rows} = await db.query(
        `SELECT COUNT(*) AS total ${SKILL_TYPE_FILTERS}`,
        filter_params,
    );

    return {
        data: rows,
        pagination: build_pagination(count_rows[0].total, limit, offset, rows.length),
    };
};

export const do_create = async (req_objx) => {
    const skill_type = parse_optional_text(req_objx.get_req_body('skill_type'));
    if (!skill_type) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const {rows} = await db.query(
        `
        INSERT INTO ${SCHEMA}.dim_skill_type (skill_type, created_at, updated_at)
        VALUES ($1, now(), now())
        RETURNING ${SKILL_TYPE_RETURNING}
        `,
        [skill_type],
    );

    return rows[0];
};

export const do_update = async (req_objx) => {
    const skill_type_key = parse_optional_int(req_objx.get_req_body('skill_type_key'));
    const skill_type = parse_optional_text(req_objx.get_req_body('skill_type'));

    if (skill_type_key === null || !skill_type) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const {rows} = await db.query(
        `
        UPDATE ${SCHEMA}.dim_skill_type
        SET skill_type = $2, updated_at = now()
        WHERE skill_type_key = $1
          AND deleted_at IS NULL
        RETURNING ${SKILL_TYPE_RETURNING}
        `,
        [skill_type_key, skill_type],
    );

    if (rows.length === 0) {
        throw new Error(error_config.select_error('skill_type_not_found'));
    }

    return rows[0];
};

export const do_delete = async (req_objx) => {
    const skill_type_key = parse_optional_int(req_objx.get_req_body('skill_type_key'));
    if (skill_type_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    // Soft delete only, so dim_skill's foreign key stays satisfied and skills already
    // pointing here keep resolving their label.
    const {rowCount} = await db.query(
        `
        UPDATE ${SCHEMA}.dim_skill_type
        SET deleted_at = now(), updated_at = now()
        WHERE skill_type_key = $1
          AND deleted_at IS NULL
        `,
        [skill_type_key],
    );

    if (rowCount === 0) {
        throw new Error(error_config.select_error('skill_type_not_found'));
    }

    return {skill_type_key, deleted: true};
};
