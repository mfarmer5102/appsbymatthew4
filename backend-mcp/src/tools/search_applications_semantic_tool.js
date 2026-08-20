import {z} from 'zod';

import {Tool} from '../_library/classes/tool.js';

// Errors propagate: unlike the site's chat, a tool should tell its caller the search
// failed rather than return nothing.
export class SearchApplicationsSemanticTool extends Tool {
    constructor({applications, openai, limits}) {
        super({limits});
        this.applications = applications;
        this.openai = openai;
    }

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

    async execute({query: search_text, limit}) {
        const embedding = await this.openai.generate_embedding(search_text);

        return await this.applications.search_by_embedding({
            embedding,
            model_version: this.openai.embedding_model,
            limit: this.resolve_limit(limit),
        });
    }
}
