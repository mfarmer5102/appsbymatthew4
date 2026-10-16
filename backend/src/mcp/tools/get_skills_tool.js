import {z} from 'zod';

import {Tool} from '../../_library/classes/tool.js';
import {do_get_many} from '../../data/skills.js';

export class GetSkillsTool extends Tool {
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

    // Hidden skills stay out, as they do on the public GET /api/skills.
    async execute({skill_type, proficient_only = false, limit}) {
        const {data} = await do_get_many({
            query: {
                skill_type,
                proficient: proficient_only ? true : undefined,
                limit: this.resolve_limit(limit),
            },
        });

        return data.map(({skill, skill_type: type, is_proficient}) => ({
            skill,
            skill_type: type,
            is_proficient,
        }));
    }
}
