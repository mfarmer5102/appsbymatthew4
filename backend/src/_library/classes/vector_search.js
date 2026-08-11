import {SCHEMA, EMBEDDING_MODEL_VERSION} from '../../configuration/database.js';

export class VectorSearchHelper {
    /**
     * @param {import('./postgres.js').PostgresConfig} postgres_config
     */
    constructor(postgres_config) {
        this.db = postgres_config;
    }

    /**
     * Search applications by vector similarity.
     *
     * Uses pgvector's cosine distance operator (<=>) and reports 1 - distance so the
     * `score` field stays a similarity in roughly the 0-1 range, matching what the
     * previous Atlas $vectorSearch pipeline returned.
     *
     * @param {Array<number>} query_embedding - 1536-dimension query vector
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise<Array>} - Array of similar application records
     */
    async searchApplications(query_embedding, limit = 5) {
        try {
            const {rows} = await this.db.query(
                `
                SELECT
                    a.application_key,
                    a.title,
                    a.description,
                    a.support_status_key,
                    ss.support_status,
                    a.is_featured,
                    a.deployed_url,
                    COALESCE(sk.skills, ARRAY[]::text[]) AS skills,
                    COALESCE(rp.repository_urls, ARRAY[]::text[]) AS repository_urls,
                    1 - (e.embedding <=> $1::vector) AS score
                FROM ${SCHEMA}.dim_application_embedding e
                JOIN ${SCHEMA}.dim_application a
                    ON a.application_key = e.application_key
                JOIN ${SCHEMA}.dim_support_status ss
                    ON ss.support_status_key = a.support_status_key
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
                WHERE a.deleted_at IS NULL
                  AND e.model_version = $2
                ORDER BY e.embedding <=> $1::vector
                LIMIT $3
                `,
                [JSON.stringify(query_embedding), EMBEDDING_MODEL_VERSION, limit],
            );

            return rows;
        } catch (error) {
            // Don't throw - return empty results so chat degrades to a generic answer
            // rather than failing outright.
            console.error('Vector search error:', error.message);
            return [];
        }
    }

    /**
     * Search applications with a minimum similarity threshold.
     * @param {Array<number>} query_embedding - 1536-dimension query vector
     * @param {number} limit - Maximum number of results to return
     * @param {number} min_score - Minimum similarity score (0-1)
     * @returns {Promise<Array>} - Array of similar application records
     */
    async searchApplicationsWithThreshold(query_embedding, limit = 5, min_score = 0.5) {
        const results = await this.searchApplications(query_embedding, limit);
        return results.filter((result) => result.score >= min_score);
    }
}
