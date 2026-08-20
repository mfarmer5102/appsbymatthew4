import {require_env} from './env.js';

import OpenAI from 'openai';

// Must match EMBEDDING_MODEL_VERSION in database.js: that is the value stored in
// dim_application_embedding.model_version, and a query vector from a different model
// would be compared against vectors it shares no space with.
export const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions

const client = new OpenAI({apiKey: require_env('OPENAI_API_KEY')});

/**
 * Embed a query string for pgvector similarity search.
 *
 * This server only ever embeds; it does not generate completions. The chat completion
 * lives in backend/ behind /api/chat, and here the *client* (Claude Desktop) is the
 * model — it calls these tools and writes the answer itself.
 */
export async function generate_embedding(text) {
    // The model's context is ~8k tokens; this bound keeps a pathological input from
    // being rejected outright.
    const truncated = text.substring(0, 30000);

    const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: truncated,
    });

    return response.data[0].embedding;
}
