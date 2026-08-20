import {OPENAI} from './config.js';

import OpenAI from 'openai';

const client = new OpenAI({apiKey: OPENAI.api_key});

/**
 * Embed a query string for pgvector similarity search.
 *
 * This server only ever embeds; it does not generate completions. The chat completion
 * lives in backend/ behind /api/chat, and here the *client* (Claude Desktop) is the
 * model — it calls these tools and writes the answer itself.
 */
export async function generate_embedding(text) {
    const response = await client.embeddings.create({
        model: OPENAI.embedding_model,
        input: text.substring(0, OPENAI.embedding_input_max_chars),
    });

    return response.data[0].embedding;
}
