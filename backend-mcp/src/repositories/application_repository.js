import {Repository} from '../_library/classes/repository.js';

// Both search tools go through here, which keeps their rows the same shape.
export class ApplicationRepository extends Repository {
    // The bridges have no ordinal column, so the arrays are aggregated in name order.
    get projection() {
        return `
            a.title,
            a.description,
            a.publish_date,
            a.deployed_url,
            a.is_featured,
            ss.support_status,
            COALESCE(sk.skills, ARRAY[]::text[]) AS skills,
            COALESCE(rp.repository_urls, ARRAY[]::text[]) AS repository_urls
        `;
    }

    // Lateral rather than group-by so an application with no skills still comes back.
    get joins() {
        return `
            JOIN ${this.schema}.dim_support_status ss
                ON ss.support_status_key = a.support_status_key
            LEFT JOIN LATERAL (
                SELECT array_agg(s.skill ORDER BY s.skill) AS skills
                FROM ${this.schema}.bridge_application_skill b
                JOIN ${this.schema}.dim_skill s ON s.skill_key = b.skill_key
                WHERE b.application_key = a.application_key
                  AND s.deleted_at IS NULL
            ) sk ON TRUE
            LEFT JOIN LATERAL (
                SELECT array_agg(r.repository_url ORDER BY r.repository_url)
                    AS repository_urls
                FROM ${this.schema}.bridge_application_repository r
                WHERE r.application_key = a.application_key
            ) rp ON TRUE
        `;
    }

    // A null search_text lists the most recent projects - how a caller browses.
    async search({search_text = null, limit}) {
        return await this.query(
            `
            SELECT ${this.projection}
            FROM ${this.schema}.dim_application a
            ${this.joins}
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

    // Reports 1 - cosine_distance so `score` reads as a 0-1 similarity. model_version
    // must be filtered on, or a second model's vectors duplicate every row.
    async search_by_embedding({embedding, model_version, limit}) {
        return await this.query(
            `
            SELECT ${this.projection},
                   1 - (e.embedding <=> $1::vector) AS score
            FROM ${this.schema}.dim_application_embedding e
            JOIN ${this.schema}.dim_application a ON a.application_key = e.application_key
            ${this.joins}
            WHERE a.deleted_at IS NULL
              AND e.model_version = $2
            ORDER BY e.embedding <=> $1::vector
            LIMIT $3
            `,
            [JSON.stringify(embedding), model_version, limit],
        );
    }
}
