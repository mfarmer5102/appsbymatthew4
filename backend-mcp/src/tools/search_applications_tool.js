import {z} from 'zod';

import {Tool} from '../_library/classes/tool.js';

export class SearchApplicationsTool extends Tool {
    constructor({applications, limits}) {
        super({limits});
        this.applications = applications;
    }

    get name() {
        return 'search_applications';
    }

    get title() {
        return 'Search applications';
    }

    get description() {
        return (
            'Keyword search over portfolio project titles and descriptions. Omit the ' +
            'query to list the most recent projects.'
        );
    }

    get input_schema() {
        return {
            query: z.string().optional().describe('Text to match against title/description'),
            limit: this.limit_input(),
        };
    }

    async execute({query: search_text, limit}) {
        return await this.applications.search({
            search_text,
            limit: this.resolve_limit(limit),
        });
    }
}
