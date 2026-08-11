const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const is_blank = (value) => value === undefined || value === null || value === '';

/**
 * Optional filters are bound with the ($n IS NULL OR col = $n) pattern, so an absent
 * filter has to arrive as a real null rather than undefined — node-postgres rejects
 * undefined parameters outright.
 */
export const parse_optional_text = (value) => (is_blank(value) ? null : String(value));

export const parse_optional_bool = (value) => {
    if (is_blank(value)) return null;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
};

export const parse_optional_int = (value) => {
    if (is_blank(value)) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

/**
 * A required integer key from a request body, e.g. the target of an update or delete.
 * @returns {number|null} null when absent or not an integer, so callers can 400 on it.
 */
export const parse_required_int = (value) => parse_optional_int(value);

export const parse_bool = (value, fallback = false) => {
    const parsed = parse_optional_bool(value);
    return parsed === null ? fallback : parsed;
};

/**
 * Clamp pagination so a caller cannot ask for an unbounded result set.
 */
export const parse_pagination = (limit_raw, offset_raw) => {
    const limit_parsed = Number(limit_raw);
    const offset_parsed = Number(offset_raw);

    const limit = Number.isFinite(limit_parsed) && limit_parsed > 0
        ? Math.min(Math.floor(limit_parsed), MAX_LIMIT)
        : DEFAULT_LIMIT;

    const offset = Number.isFinite(offset_parsed) && offset_parsed > 0
        ? Math.floor(offset_parsed)
        : 0;

    return {limit, offset};
};

/**
 * ORDER BY cannot be parameterized, so a sort field has to be matched against a
 * whitelist before it reaches the query text.
 */
export const parse_sort = (field_raw, order_raw, allowed_fields, default_field) => {
    const field = allowed_fields.includes(field_raw) ? field_raw : default_field;
    const direction = String(order_raw).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    return {field, direction};
};

export const build_pagination = (total, limit, offset, returned_count) => ({
    total,
    limit,
    offset,
    hasMore: (offset + returned_count) < total,
});
