import {OPENAI} from './config.js';

import OpenAI from 'openai';

const client = new OpenAI({apiKey: OPENAI.api_key});

// This server only embeds, never completes: the client (Claude Desktop) is the model,
// and writes the answer itself from the rows these tools return.
export async function generate_embedding(text) {
    const response = await client.embeddings.create({
        model: OPENAI.embedding_model,
        input: text.substring(0, OPENAI.embedding_input_max_chars),
    });

    return response.data[0].embedding;
}
