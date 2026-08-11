/**
 * Verify that the Supabase database is wired up the way the application expects.
 *
 * Checks connectivity, the schema and its tables, the pgvector extension, identity
 * sequence positions, and embedding coverage. Read-only — it changes nothing.
 *
 * Usage:
 *   npm run check-db
 */

import 'dotenv/config';

import {postgres_config as db, SCHEMA, EMBEDDING_MODEL_VERSION} from '../src/configuration/database.js';

const PASS = 'PASS';
const WARN = 'WARN';
const FAIL = 'FAIL';

const results = [];
const record = (status, label, detail) => {
    results.push({status, label, detail});
    console.log(`  [${status}] ${label}${detail ? ` — ${detail}` : ''}`);
};

const DIMENSIONS = [
    {table: 'dim_application', key: 'application_key', soft_delete: true},
    {table: 'dim_skill', key: 'skill_key', soft_delete: true},
    {table: 'dim_skill_type', key: 'skill_type_key', soft_delete: true},
    {table: 'dim_support_status', key: 'support_status_key', soft_delete: true},
];

const BRIDGES = ['bridge_application_skill', 'bridge_application_repository'];

async function check_connection() {
    console.log('\nConnection');
    const {rows} = await db.query('SELECT version() AS version, current_database() AS database');
    record(PASS, 'Connected', `${rows[0].database} — ${rows[0].version.split(',')[0]}`);
}

async function check_extension() {
    console.log('\nExtensions');
    const {rows} = await db.query(`SELECT extversion FROM pg_extension WHERE extname = 'vector'`);
    if (rows.length === 0) {
        record(FAIL, 'pgvector not installed', `run: CREATE EXTENSION IF NOT EXISTS vector;`);
    } else {
        record(PASS, 'pgvector installed', `v${rows[0].extversion}`);
    }
}

async function check_tables() {
    console.log('\nTables');
    const expected = [...DIMENSIONS.map((d) => d.table), ...BRIDGES, 'dim_application_embedding'];

    const {rows} = await db.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
        [SCHEMA],
    );
    const present = new Set(rows.map((r) => r.table_name));

    for (const table of expected) {
        if (!present.has(table)) {
            record(FAIL, `${table} missing`, `expected in schema ${SCHEMA}`);
            continue;
        }
        const {rows: count_rows} = await db.query(`SELECT COUNT(*) AS total FROM ${SCHEMA}.${table}`);
        record(PASS, table, `${count_rows[0].total} rows`);
    }
}

/**
 * Loading rows with explicit keys leaves an identity sequence sitting at its start
 * value, so the next INSERT collides with existing data. This is the single most
 * likely breakage after a bulk import.
 */
async function check_identity_sequences() {
    console.log('\nIdentity sequences');

    for (const {table, key} of DIMENSIONS) {
        const {rows: seq_rows} = await db.query(
            `SELECT pg_get_serial_sequence($1, $2) AS sequence_name`,
            [`${SCHEMA}.${table}`, key],
        );
        const sequence_name = seq_rows[0]?.sequence_name;

        if (!sequence_name) {
            record(FAIL, `${table}.${key} has no sequence`, 'identity was not applied to this column');
            continue;
        }

        const {rows} = await db.query(
            `
            SELECT
                (SELECT COALESCE(MAX(${key}), 0) FROM ${SCHEMA}.${table}) AS max_key,
                (SELECT last_value FROM ${sequence_name})                 AS last_value,
                (SELECT is_called FROM ${sequence_name})                  AS is_called
            `,
        );

        const {max_key, last_value, is_called} = rows[0];
        const next_value = is_called ? Number(last_value) + 1 : Number(last_value);

        if (next_value <= Number(max_key)) {
            record(
                FAIL,
                `${table}.${key} sequence is behind`,
                `next=${next_value}, max=${max_key} — run: SELECT setval('${sequence_name}', ${max_key});`,
            );
        } else {
            record(PASS, `${table}.${key} sequence`, `next=${next_value}, max=${max_key}`);
        }
    }
}

async function check_soft_delete_columns() {
    console.log('\nSoft-delete columns');
    const {rows} = await db.query(
        `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND column_name IN ('deleted_at', 'created_at', 'updated_at')
        `,
        [SCHEMA],
    );

    const by_table = new Map();
    for (const row of rows) {
        if (!by_table.has(row.table_name)) by_table.set(row.table_name, new Set());
        by_table.get(row.table_name).add(row.column_name);
    }

    for (const {table, soft_delete} of DIMENSIONS) {
        const columns = by_table.get(table) ?? new Set();
        if (soft_delete && !columns.has('deleted_at')) {
            record(FAIL, `${table}.deleted_at missing`, 'delete endpoint cannot soft-delete');
        } else {
            record(PASS, `${table}`, [...columns].sort().join(', ') || 'none');
        }
    }
}

async function check_embeddings() {
    console.log('\nEmbeddings');

    const {rows: type_rows} = await db.query(
        `
        SELECT format_type(a.atttypid, a.atttypmod) AS column_type
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = 'dim_application_embedding' AND a.attname = 'embedding'
        `,
        [SCHEMA],
    );

    const column_type = type_rows[0]?.column_type;
    if (column_type === 'vector(1536)') {
        record(PASS, 'embedding column typed', column_type);
    } else {
        record(WARN, 'embedding column not pinned to 1536', `is ${column_type ?? 'missing'}`);
    }

    const {rows} = await db.query(
        `
        SELECT
            (SELECT COUNT(*) FROM ${SCHEMA}.dim_application WHERE deleted_at IS NULL) AS live_applications,
            (
                SELECT COUNT(*)
                FROM ${SCHEMA}.dim_application a
                JOIN ${SCHEMA}.dim_application_embedding e
                    ON e.application_key = a.application_key AND e.model_version = $1
                WHERE a.deleted_at IS NULL
            ) AS embedded_applications,
            (
                SELECT COUNT(DISTINCT model_version)
                FROM ${SCHEMA}.dim_application_embedding
                WHERE model_version <> $1
            ) AS other_model_versions
        `,
        [EMBEDDING_MODEL_VERSION],
    );

    const {live_applications, embedded_applications, other_model_versions} = rows[0];

    if (live_applications === 0) {
        record(WARN, 'No live applications', 'nothing to embed');
    } else if (embedded_applications < live_applications) {
        record(
            WARN,
            'Embedding coverage incomplete',
            `${embedded_applications}/${live_applications} for ${EMBEDDING_MODEL_VERSION} — run: npm run vectorize-existing-apps`,
        );
    } else {
        record(PASS, 'Embedding coverage', `${embedded_applications}/${live_applications} for ${EMBEDDING_MODEL_VERSION}`);
    }

    if (Number(other_model_versions) > 0) {
        record(WARN, 'Other model versions present', `${other_model_versions} — these are ignored by vector search`);
    }
}

async function check_referential_health() {
    console.log('\nReferential health');

    const {rows} = await db.query(
        `
        SELECT
            (
                SELECT COUNT(*) FROM ${SCHEMA}.dim_application a
                WHERE a.deleted_at IS NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM ${SCHEMA}.bridge_application_skill b
                      WHERE b.application_key = a.application_key
                  )
            ) AS applications_without_skills,
            (
                SELECT COUNT(*) FROM ${SCHEMA}.dim_skill s
                WHERE s.deleted_at IS NULL AND s.is_hidden = true
            ) AS hidden_skills
        `,
    );

    const {applications_without_skills, hidden_skills} = rows[0];

    if (Number(applications_without_skills) > 0) {
        record(WARN, 'Applications with no linked skills', `${applications_without_skills}`);
    } else {
        record(PASS, 'All live applications have linked skills', '');
    }
    record(PASS, 'Hidden skills', `${hidden_skills} (excluded from public listings)`);
}

async function main() {
    console.log(`Checking ${SCHEMA} schema`);

    await check_connection();
    await check_extension();
    await check_tables();
    await check_identity_sequences();
    await check_soft_delete_columns();
    await check_embeddings();
    await check_referential_health();

    const failures = results.filter((r) => r.status === FAIL).length;
    const warnings = results.filter((r) => r.status === WARN).length;

    console.log(`\n${results.length} checks — ${failures} failed, ${warnings} warnings`);
    return failures > 0 ? 1 : 0;
}

main()
    .then(async (exit_code) => {
        await db.close();
        process.exit(exit_code);
    })
    .catch(async (error) => {
        console.error('\nCheck failed:', error.message);
        await db.close();
        process.exit(1);
    });
