import {Repository} from '../_library/classes/repository.js';

export class LookupRepository extends Repository {
    async skill_types() {
        const rows = await this.query(
            `SELECT skill_type FROM ${this.schema}.dim_skill_type
             WHERE deleted_at IS NULL ORDER BY skill_type`,
        );

        return rows.map((row) => row.skill_type);
    }

    async support_statuses() {
        const rows = await this.query(
            `SELECT support_status FROM ${this.schema}.dim_support_status
             WHERE deleted_at IS NULL ORDER BY support_status`,
        );

        return rows.map((row) => row.support_status);
    }
}
