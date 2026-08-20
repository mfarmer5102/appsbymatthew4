import {z} from 'zod';

import {Tool} from '../_library/classes/tool.js';

export class GetSkillsTool extends Tool {
    constructor({skills, limits}) {
        super({limits});
        this.skills = skills;
    }

    get name() {
        return 'get_skills';
    }

    get title() {
        return 'Get skills';
    }

    get description() {
        return (
            'List skills, optionally filtered by skill type or to proficient ones ' +
            'only. Call list_lookups for the valid skill_type values.'
        );
    }

    get input_schema() {
        return {
            skill_type: z.string().optional().describe('Exact skill type, e.g. "Database"'),
            proficient_only: z.boolean().optional(),
            limit: this.limit_input(),
        };
    }

    async execute({skill_type, proficient_only = false, limit}) {
        return await this.skills.list({
            skill_type,
            proficient_only,
            limit: this.resolve_limit(limit),
        });
    }
}
