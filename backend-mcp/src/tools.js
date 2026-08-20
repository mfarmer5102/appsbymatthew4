import {query, SCHEMA, EMBEDDING_MODEL_VERSION} from './database.js';
import {generate_embedding} from './openai.js';

// Skills and repository URLs live in bridge tables with no ordinal column, so their
// original order is not recoverable; both are aggregated in name order for stable
// output. Shared by both search tools so their results have the same shape.
const APPLICATION_PROJECTION = `
    a.title,
    a.description,
    a.publish_date,
    a.deployed_url,
    a.is_featured,
    ss.support_status,
    COALESCE(sk.skills, ARRAY[]::text[]) AS skills,
    COALESCE(rp.repository_urls, ARRAY[]::text[]) AS repository_urls
`;

const APPLICATION_JOINS = `
    JOIN ${SCHEMA}.dim_support_status ss ON ss.support_status_key = a.support_status_key
    LEFT JOIN LATERAL (
        SELECT array_agg(s.skill ORDER BY s.skill) AS skills
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

/**
 * Keyword search over application title/description. Cheap and exact-ish - good for
 * "do I have an app called X". Omitting the query returns the most recent projects,
 * which is how a caller browses rather than searches.
 */
export async function search_applications({query: search_text, limit = 10}) {
    const {rows} = await query(
        `
        SELECT ${APPLICATION_PROJECTION}
        FROM ${SCHEMA}.dim_application a
        ${APPLICATION_JOINS}
        WHERE a.deleted_at IS NULL
          AND ($1::text IS NULL
               OR a.title ILIKE '%' || $1 || '%'
               OR a.description ILIKE '%' || $1 || '%')
        ORDER BY a.publish_date DESC, a.title
        LIMIT $2
        `,
        [search_text || null, limit],
    );

    return rows;
}

/**
 * Vector similarity search over the same pgvector index the site's /api/chat uses.
 *
 * Reports 1 - cosine_distance so `score` reads as a similarity in roughly the 0-1
 * range. Unlike the chat endpoint's version this lets errors propagate: there the
 * search degrades to a generic answer, whereas an MCP tool should tell its caller
 * plainly that the search failed rather than silently returning nothing.
 */
export async function search_applications_semantic({query: search_text, limit = 5}) {
    const embedding = await generate_embedding(search_text);

    const {rows} = await query(
        `
        SELECT ${APPLICATION_PROJECTION},
               1 - (e.embedding <=> $1::vector) AS score
        FROM ${SCHEMA}.dim_application_embedding e
        JOIN ${SCHEMA}.dim_application a ON a.application_key = e.application_key
        ${APPLICATION_JOINS}
        WHERE a.deleted_at IS NULL
          AND e.model_version = $2
        ORDER BY e.embedding <=> $1::vector
        LIMIT $3
        `,
        [JSON.stringify(embedding), EMBEDDING_MODEL_VERSION, limit],
    );

    return rows;
}

export async function get_skills({skill_type, proficient_only = false, limit = 100}) {
    const {rows} = await query(
        `
        SELECT s.skill, st.skill_type, s.is_proficient
        FROM ${SCHEMA}.dim_skill s
        JOIN ${SCHEMA}.dim_skill_type st ON st.skill_type_key = s.skill_type_key
        WHERE s.deleted_at IS NULL
          AND s.is_hidden = false
          AND ($1::text IS NULL OR st.skill_type = $1)
          AND ($2::boolean IS FALSE OR s.is_proficient = TRUE)
        ORDER BY st.skill_type, s.skill
        LIMIT $3
        `,
        [skill_type || null, proficient_only, limit],
    );

    return rows;
}

/**
 * The two small lookup dimensions, returned together: neither is much use without the
 * other to a caller trying to learn what values the other tools' filters accept.
 */
export async function list_lookups() {
    const [skill_types, support_statuses] = await Promise.all([
        query(
            `SELECT skill_type FROM ${SCHEMA}.dim_skill_type
             WHERE deleted_at IS NULL ORDER BY skill_type`,
        ),
        query(
            `SELECT support_status FROM ${SCHEMA}.dim_support_status
             WHERE deleted_at IS NULL ORDER BY support_status`,
        ),
    ]);

    return {
        skill_types: skill_types.rows.map((row) => row.skill_type),
        support_statuses: support_statuses.rows.map((row) => row.support_status),
    };
}
