// Tool catalog: description, schema and handler travel together, so adding a tool means
// adding one object to TOOLS below and nothing in server.js.
import {z} from 'zod';

import {query} from './database.js';
import {generate_embedding} from './openai.js';
import {DATABASE, OPENAI, LIMITS} from './config.js';

// Aliased — it is interpolated into nearly every query below.
const {schema: SCHEMA} = DATABASE;

// Shared by both search tools so their rows have the same shape. The bridge tables have
// no ordinal column, so skills and repository URLs are aggregated in name order.
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

// The `limit` input shared by every list tool. See LIMITS in config.js.
const limit_schema = (tool_name) =>
    z
        .number()
        .int()
        .positive()
        .max(LIMITS[tool_name].max)
        .optional()
        .describe(`Maximum rows to return (default ${LIMITS[tool_name].default})`);

// Omitting the query lists the most recent projects, which is how a caller browses.
async function search_applications({query: search_text, limit = LIMITS.search_applications.default}) {
    return await query(
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
}

// Same pgvector index the site's /api/chat uses. Reports 1 - cosine_distance so `score`
// reads as a 0-1 similarity. Errors propagate: unlike chat, which degrades to a generic
// answer, a tool should tell its caller the search failed rather than return nothing.
async function search_applications_semantic({
    query: search_text,
    limit = LIMITS.search_applications_semantic.default,
}) {
    const embedding = await generate_embedding(search_text);

    return await query(
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
        [JSON.stringify(embedding), OPENAI.embedding_model, limit],
    );
}

async function get_skills({skill_type, proficient_only = false, limit = LIMITS.get_skills.default}) {
    return await query(
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
}

// Returned together: a caller learning what the filters accept wants both.
async function list_lookups() {
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
        skill_types: skill_types.map((row) => row.skill_type),
        support_statuses: support_statuses.map((row) => row.support_status),
    };
}

export const TOOLS = [
    {
        name: 'search_applications',
        title: 'Search applications',
        description:
            'Keyword search over portfolio project titles and descriptions. Omit the ' +
            'query to list the most recent projects.',
        input_schema: {
            query: z.string().optional().describe('Text to match against title/description'),
            limit: limit_schema('search_applications'),
        },
        handler: search_applications,
    },
    {
        name: 'search_applications_semantic',
        title: 'Semantic search applications',
        description:
            'Conceptual search over portfolio projects using the same pgvector index the ' +
            'site\'s AI chat uses. Better than keyword search for questions like "what did ' +
            'he build involving background jobs".',
        input_schema: {
            query: z.string().describe('Natural-language description of what to find'),
            limit: limit_schema('search_applications_semantic'),
        },
        handler: search_applications_semantic,
    },
    {
        name: 'get_skills',
        title: 'Get skills',
        description:
            'List skills, optionally filtered by skill type or to proficient ones only. ' +
            'Call list_lookups for the valid skill_type values.',
        input_schema: {
            skill_type: z.string().optional().describe('Exact skill type, e.g. "Database"'),
            proficient_only: z.boolean().optional(),
            limit: limit_schema('get_skills'),
        },
        handler: get_skills,
    },
    {
        name: 'list_lookups',
        title: 'List lookup values',
        description:
            'List every skill type and support status used across the portfolio. Useful ' +
            'for discovering the values the other tools accept as filters.',
        input_schema: {},
        handler: list_lookups,
    },
];
