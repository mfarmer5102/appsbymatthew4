import {z} from 'zod';

import {Tool} from '../../_library/classes/tool.js';
import {do_get_many} from '../../data/applications.js';
import {to_model_application} from '../projections.js';

export class SearchApplicationsTool extends Tool {
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

    // The same query GET /api/applications runs, through its `search` filter.
    async execute({query: search, limit}) {
        const {data} = await do_get_many({
            query: {search, limit: this.resolve_limit(limit)},
        });

        return data.map(to_model_application);
    }
}
