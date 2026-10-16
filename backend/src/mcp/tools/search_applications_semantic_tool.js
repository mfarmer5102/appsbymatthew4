import {z} from 'zod';

import {Tool} from '../../_library/classes/tool.js';
import {openai_config} from '../../configuration/openai.js';
import {vector_search_helper} from '../../configuration/vector_search.js';
import {to_model_application} from '../projections.js';

// Errors propagate: unlike the site's chat, which degrades to a generic answer, a tool
// should tell its caller the search failed rather than return nothing.
export class SearchApplicationsSemanticTool extends Tool {
    get name() {
        return 'search_applications_semantic';
    }

    get title() {
        return 'Semantic search applications';
    }

    get description() {
        return (
            'Conceptual search over portfolio projects using the same pgvector index ' +
            'the site\'s AI chat uses. Better than keyword search for questions like ' +
            '"what did he build involving background jobs".'
        );
    }

    get input_schema() {
        return {
            query: z.string().describe('Natural-language description of what to find'),
            limit: this.limit_input(),
        };
    }

    async execute({query, limit}) {
        const embedding = await openai_config.generateEmbedding(query);
        const rows = await vector_search_helper.searchApplicationsOrThrow(
            embedding,
            this.resolve_limit(limit),
        );

        return rows.map((row) => ({...to_model_application(row), score: row.score}));
    }
}
