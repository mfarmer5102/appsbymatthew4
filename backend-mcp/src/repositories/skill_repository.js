import {Repository} from '../_library/classes/repository.js';

export class SkillRepository extends Repository {
    async list({skill_type = null, proficient_only = false, limit}) {
        return await this.query(
            `
            SELECT s.skill, st.skill_type, s.is_proficient
            FROM ${this.schema}.dim_skill s
            JOIN ${this.schema}.dim_skill_type st ON st.skill_type_key = s.skill_type_key
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
}
