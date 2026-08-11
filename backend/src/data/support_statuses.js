import {db, SCHEMA} from '../configuration/database.js';
import {error_config} from '../configuration/errors.js';
import {
    parse_optional_text,
    parse_optional_int,
    parse_pagination,
    build_pagination,
} from '../_library/functions/query_params.js';

const SUPPORT_STATUS_COLUMNS = `
    ss.support_status_key,
    ss.support_status,
    ss.created_at,
    ss.updated_at
`;

// INSERT and UPDATE have no table alias to qualify against, so RETURNING needs the
// bare column names.
const SUPPORT_STATUS_RETURNING = `support_status_key, support_status, created_at, updated_at`;

const SUPPORT_STATUS_FILTERS = `
    FROM ${SCHEMA}.dim_support_status ss
    WHERE ss.deleted_at IS NULL
      AND ($1::text IS NULL OR ss.support_status = $1)
`;

export const do_get_many = async (req_objx) => {
    const support_status = parse_optional_text(req_objx.get_query_string_param('support_status'));
    const {limit, offset} = parse_pagination(
        req_objx.get_query_string_param('limit'),
        req_objx.get_query_string_param('offset'),
    );

    const filter_params = [support_status];

    const {rows} = await db.query(
        `
        SELECT ${SUPPORT_STATUS_COLUMNS}
        ${SUPPORT_STATUS_FILTERS}
        ORDER BY ss.support_status ASC
        LIMIT $2 OFFSET $3
        `,
        [...filter_params, limit, offset],
    );

    const {rows: count_rows} = await db.query(
        `SELECT COUNT(*) AS total ${SUPPORT_STATUS_FILTERS}`,
        filter_params,
    );

    return {
        data: rows,
        pagination: build_pagination(count_rows[0].total, limit, offset, rows.length),
    };
};

export const do_create = async (req_objx) => {
    const support_status = parse_optional_text(req_objx.get_req_body('support_status'));
    if (!support_status) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const {rows} = await db.query(
        `
        INSERT INTO ${SCHEMA}.dim_support_status (support_status, created_at, updated_at)
        VALUES ($1, now(), now())
        RETURNING ${SUPPORT_STATUS_RETURNING}
        `,
        [support_status],
    );

    return rows[0];
};

export const do_update = async (req_objx) => {
    const support_status_key = parse_optional_int(req_objx.get_req_body('support_status_key'));
    const support_status = parse_optional_text(req_objx.get_req_body('support_status'));

    if (support_status_key === null || !support_status) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const {rows} = await db.query(
        `
        UPDATE ${SCHEMA}.dim_support_status
        SET support_status = $2, updated_at = now()
        WHERE support_status_key = $1
          AND deleted_at IS NULL
        RETURNING ${SUPPORT_STATUS_RETURNING}
        `,
        [support_status_key, support_status],
    );

    if (rows.length === 0) {
        throw new Error(error_config.select_error('support_status_not_found'));
    }

    return rows[0];
};

export const do_delete = async (req_objx) => {
    const support_status_key = parse_optional_int(req_objx.get_req_body('support_status_key'));
    if (support_status_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    // Soft delete only, so dim_application's foreign key stays satisfied.
    const {rowCount} = await db.query(
        `
        UPDATE ${SCHEMA}.dim_support_status
        SET deleted_at = now(), updated_at = now()
        WHERE support_status_key = $1
          AND deleted_at IS NULL
        `,
        [support_status_key],
    );

    if (rowCount === 0) {
        throw new Error(error_config.select_error('support_status_not_found'));
    }

    return {support_status_key, deleted: true};
};
