import {db, SCHEMA, EMBEDDING_MODEL_VERSION} from '../configuration/database.js';
import {error_config} from '../configuration/errors.js';
import secret_config from '../configuration/secrets.js';
import {OpenAIConfig} from '../_library/classes/openai.js';
import {
    parse_optional_text,
    parse_optional_bool,
    parse_optional_int,
    parse_pagination,
    build_pagination,
} from '../_library/functions/query_params.js';

const openai_config = new OpenAIConfig(secret_config['OPENAI_API_KEY']);

// bridge_application_repository is keyed on (application_key, repository_url) with no
// ordinal column, so the source array's order is not recoverable. Sorting by URL at
// least makes "the first repository" stable across requests.
const APPLICATION_COLUMNS = `
    a.application_key,
    a.title,
    a.description,
    a.publish_date,
    a.support_status_key,
    ss.support_status,
    a.image_filename,
    a.deployed_url,
    a.is_featured,
    a.created_at,
    a.updated_at,
    COALESCE(sk.skill_keys, ARRAY[]::int[]) AS skill_keys,
    COALESCE(sk.skills, ARRAY[]::text[]) AS skills,
    COALESCE(rp.repository_urls, ARRAY[]::text[]) AS repository_urls
`;

const APPLICATION_JOINS = `
    FROM ${SCHEMA}.dim_application a
    JOIN ${SCHEMA}.dim_support_status ss
        ON ss.support_status_key = a.support_status_key
    LEFT JOIN LATERAL (
        SELECT array_agg(s.skill_key ORDER BY s.skill) AS skill_keys,
               array_agg(s.skill     ORDER BY s.skill) AS skills
        FROM ${SCHEMA}.bridge_application_skill b
        JOIN ${SCHEMA}.dim_skill s ON s.skill_key = b.skill_key
        WHERE b.application_key = a.application_key
          AND s.deleted_at IS NULL
    ) sk ON TRUE
    LEFT JOIN LATERAL (
        SELECT array_agg(r.repository_url ORDER BY r.repository_url) AS repository_urls
        FROM ${SCHEMA}.bridge_application_repository r
        WHERE r.application_key = a.application_key
    ) rp ON TRUE
`;

// Bound with a fixed placeholder count so the identical clause can drive both the page
// query and the count query. An absent filter arrives as null and drops out.
const APPLICATION_FILTERS = `
    WHERE a.deleted_at IS NULL
      AND ($1::text    IS NULL OR a.title = $1)
      AND ($2::boolean IS NULL OR a.is_featured = $2)
      AND ($3::int     IS NULL OR a.support_status_key = $3)
`;

/**
 * Build the text an application is embedded from. Skill names and the support status
 * label are resolved from their keys first, so the vector reflects readable terms
 * ("React", "Active") rather than surrogate integers a user would never type.
 */
function format_for_vectorization({title, description, skills, support_status}) {
    const parts = [];

    if (title) parts.push(`Title: ${title}`);
    if (description) parts.push(`Description: ${description}`);
    if (skills && skills.length > 0) parts.push(`Technologies/Skills: ${skills.join(', ')}`);
    if (support_status) parts.push(`Support Status: ${support_status}`);

    return parts.join('\n');
}

/**
 * Resolve the display text behind a support status key and a set of skill keys in a
 * single round trip, for embedding purposes.
 */
async function resolve_embedding_terms(support_status_key, skill_keys) {
    const {rows} = await db.query(
        `
        SELECT
            (
                SELECT ss.support_status
                FROM ${SCHEMA}.dim_support_status ss
                WHERE ss.support_status_key = $1
            ) AS support_status,
            (
                SELECT COALESCE(array_agg(s.skill ORDER BY s.skill), ARRAY[]::text[])
                FROM ${SCHEMA}.dim_skill s
                WHERE s.skill_key = ANY($2::int[])
            ) AS skills
        `,
        [support_status_key, skill_keys],
    );

    return rows[0];
}

/**
 * Embeddings are generated before any transaction opens. The OpenAI call is slow and
 * unrelated to the write, and holding a pooler slot open across it would be wasteful.
 * Failure stays non-fatal, matching the previous behaviour: the application saves, it
 * just will not surface in chat until re-vectorized.
 */
async function generate_embedding_or_null(source) {
    try {
        const text_to_vectorize = format_for_vectorization(source);
        if (!text_to_vectorize) return null;
        return await openai_config.generateEmbedding(text_to_vectorize);
    } catch (error) {
        console.error(`Failed to generate embedding for "${source.title}":`, error.message);
        return null;
    }
}

/**
 * pgvector's text input format is a bracketed list, which is exactly JSON's.
 */
const to_vector_literal = (embedding) => JSON.stringify(embedding);

async function upsert_embedding(client, application_key, embedding) {
    if (!embedding) return;

    await client.query(
        `
        INSERT INTO ${SCHEMA}.dim_application_embedding (application_key, model_version, embedding)
        VALUES ($1, $2, $3::vector)
        ON CONFLICT (application_key, model_version)
        DO UPDATE SET embedding = EXCLUDED.embedding, created_at = now()
        `,
        [application_key, EMBEDDING_MODEL_VERSION, to_vector_literal(embedding)],
    );
}

/**
 * Replace an application's bridge rows wholesale. Delete-then-insert keeps the write
 * idempotent and matches the semantics of the array field it replaces, where a PUT
 * carried the complete list rather than a delta.
 */
async function replace_skill_links(client, application_key, skill_keys) {
    await client.query(
        `DELETE FROM ${SCHEMA}.bridge_application_skill WHERE application_key = $1`,
        [application_key],
    );

    if (!skill_keys || skill_keys.length === 0) return;

    await client.query(
        `
        INSERT INTO ${SCHEMA}.bridge_application_skill (application_key, skill_key)
        SELECT $1, UNNEST($2::int[])
        `,
        [application_key, skill_keys],
    );
}

async function replace_repository_links(client, application_key, repository_urls) {
    await client.query(
        `DELETE FROM ${SCHEMA}.bridge_application_repository WHERE application_key = $1`,
        [application_key],
    );

    if (!repository_urls || repository_urls.length === 0) return;

    await client.query(
        `
        INSERT INTO ${SCHEMA}.bridge_application_repository (application_key, repository_url)
        SELECT $1, UNNEST($2::text[])
        `,
        [application_key, repository_urls],
    );
}

/**
 * Read one application back through the standard projection, so create and update
 * return the same shape the list endpoint does.
 */
async function select_application(client, application_key) {
    const {rows} = await client.query(
        `SELECT ${APPLICATION_COLUMNS} ${APPLICATION_JOINS} WHERE a.application_key = $1`,
        [application_key],
    );
    return rows[0] ?? null;
}

/**
 * Normalize an incoming array of skill keys: integers only, de-duplicated. Duplicates
 * would violate the bridge table's composite primary key.
 */
function normalize_skill_keys(raw) {
    if (!Array.isArray(raw)) return [];
    const keys = raw
        .map((value) => parse_optional_int(value))
        .filter((value) => value !== null);
    return [...new Set(keys)];
}

function normalize_repository_urls(raw) {
    if (!Array.isArray(raw)) return [];
    const urls = raw
        .map((value) => parse_optional_text(value))
        .filter((value) => value !== null);
    return [...new Set(urls)];
}

/**
 * Translate Postgres constraint failures into the API's error vocabulary. Relying on
 * the constraint rather than a pre-flight SELECT closes the race where two concurrent
 * creates both find the title free.
 */
function translate_write_error(error) {
    if (error.code === '23505') {
        // dim_application_title_key
        return new Error(error_config.select_error('application_already_exists'));
    }
    if (error.code === '23503') {
        // support_status_key or skill_key pointing at a row that does not exist
        return new Error(error_config.select_error('invalid_reference'));
    }
    return error;
}

function read_application_body(req_objx) {
    const title = parse_optional_text(req_objx.get_req_body('title'));
    const publish_date = parse_optional_text(req_objx.get_req_body('publish_date'));
    const support_status_key = parse_optional_int(req_objx.get_req_body('support_status_key'));

    // publish_date and support_status_key are NOT NULL in the schema, and title is the
    // application's natural identity. Validating here yields a 400 instead of letting
    // Postgres raise a 500-shaped constraint error.
    if (!title || !publish_date || support_status_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    return {
        title,
        publish_date,
        support_status_key,
        description: parse_optional_text(req_objx.get_req_body('description')),
        image_filename: parse_optional_text(req_objx.get_req_body('image_filename')),
        deployed_url: parse_optional_text(req_objx.get_req_body('deployed_url')),
        is_featured: parse_optional_bool(req_objx.get_req_body('is_featured')) ?? false,
        skill_keys: normalize_skill_keys(req_objx.get_req_body('skill_keys')),
        repository_urls: normalize_repository_urls(req_objx.get_req_body('repository_urls')),
    };
}

export const do_get_many = async (req_objx) => {
    const title = parse_optional_text(req_objx.get_query_string_param('title'));
    const is_featured = parse_optional_bool(req_objx.get_query_string_param('featured'));
    const support_status_key = parse_optional_int(req_objx.get_query_string_param('support_status_key'));
    const {limit, offset} = parse_pagination(
        req_objx.get_query_string_param('limit'),
        req_objx.get_query_string_param('offset'),
    );

    const filter_params = [title, is_featured, support_status_key];

    const {rows} = await db.query(
        `
        SELECT ${APPLICATION_COLUMNS}
        ${APPLICATION_JOINS}
        ${APPLICATION_FILTERS}
        ORDER BY a.publish_date DESC, a.application_key DESC
        LIMIT $4 OFFSET $5
        `,
        [...filter_params, limit, offset],
    );

    // Counted separately rather than with COUNT(*) OVER(), which would report 0 for an
    // offset past the end of the result set and break hasMore.
    const {rows: count_rows} = await db.query(
        `SELECT COUNT(*) AS total FROM ${SCHEMA}.dim_application a ${APPLICATION_FILTERS}`,
        filter_params,
    );

    return {
        data: rows,
        pagination: build_pagination(count_rows[0].total, limit, offset, rows.length),
    };
};

export const do_create = async (req_objx) => {
    const body = read_application_body(req_objx);

    const terms = await resolve_embedding_terms(body.support_status_key, body.skill_keys);
    const embedding = await generate_embedding_or_null({
        title: body.title,
        description: body.description,
        skills: terms.skills,
        support_status: terms.support_status,
    });

    try {
        return await db.transaction(async (client) => {
            const {rows} = await client.query(
                `
                INSERT INTO ${SCHEMA}.dim_application
                    (title, description, publish_date, support_status_key,
                     image_filename, deployed_url, is_featured, created_at, updated_at)
                VALUES ($1, $2, $3::date, $4, $5, $6, $7, now(), now())
                RETURNING application_key
                `,
                [
                    body.title,
                    body.description,
                    body.publish_date,
                    body.support_status_key,
                    body.image_filename,
                    body.deployed_url,
                    body.is_featured,
                ],
            );

            const {application_key} = rows[0];

            await replace_skill_links(client, application_key, body.skill_keys);
            await replace_repository_links(client, application_key, body.repository_urls);
            await upsert_embedding(client, application_key, embedding);

            return await select_application(client, application_key);
        });
    } catch (error) {
        throw translate_write_error(error);
    }
};

export const do_update = async (req_objx) => {
    const application_key = parse_optional_int(req_objx.get_req_body('application_key'));
    if (application_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const body = read_application_body(req_objx);

    const terms = await resolve_embedding_terms(body.support_status_key, body.skill_keys);
    const embedding = await generate_embedding_or_null({
        title: body.title,
        description: body.description,
        skills: terms.skills,
        support_status: terms.support_status,
    });

    try {
        return await db.transaction(async (client) => {
            const {rowCount} = await client.query(
                `
                UPDATE ${SCHEMA}.dim_application
                SET title              = $2,
                    description        = $3,
                    publish_date       = $4::date,
                    support_status_key = $5,
                    image_filename     = $6,
                    deployed_url       = $7,
                    is_featured        = $8,
                    updated_at         = now()
                WHERE application_key = $1
                  AND deleted_at IS NULL
                `,
                [
                    application_key,
                    body.title,
                    body.description,
                    body.publish_date,
                    body.support_status_key,
                    body.image_filename,
                    body.deployed_url,
                    body.is_featured,
                ],
            );

            if (rowCount === 0) {
                throw new Error(error_config.select_error('application_not_found'));
            }

            await replace_skill_links(client, application_key, body.skill_keys);
            await replace_repository_links(client, application_key, body.repository_urls);
            await upsert_embedding(client, application_key, embedding);

            return await select_application(client, application_key);
        });
    } catch (error) {
        throw translate_write_error(error);
    }
};

/**
 * Regenerate embeddings for every live application. Rows are re-read through the
 * standard projection so the embedded text uses the same skill and status names the
 * write paths use.
 */
export const do_vectorize = async () => {
    const {rows} = await db.query(
        `SELECT ${APPLICATION_COLUMNS} ${APPLICATION_JOINS} WHERE a.deleted_at IS NULL`,
    );

    let processed = 0;
    let failed = 0;

    for (const application of rows) {
        const embedding = await generate_embedding_or_null({
            title: application.title,
            description: application.description,
            skills: application.skills,
            support_status: application.support_status,
        });

        if (!embedding) {
            failed++;
            continue;
        }

        try {
            await db.transaction(async (client) => {
                await upsert_embedding(client, application.application_key, embedding);
            });
            processed++;
        } catch (error) {
            console.error(`Failed to store embedding for "${application.title}":`, error.message);
            failed++;
        }
    }

    return {total: rows.length, processed, failed};
};

export const do_delete = async (req_objx) => {
    const application_key = parse_optional_int(req_objx.get_req_body('application_key'));
    if (application_key === null) {
        throw new Error(error_config.select_error('missing_required_field'));
    }

    const {rowCount} = await db.query(
        `
        UPDATE ${SCHEMA}.dim_application
        SET deleted_at = now(), updated_at = now()
        WHERE application_key = $1
          AND deleted_at IS NULL
        `,
        [application_key],
    );

    if (rowCount === 0) {
        throw new Error(error_config.select_error('application_not_found'));
    }

    return {application_key, deleted: true};
};
