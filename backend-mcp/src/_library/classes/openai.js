import OpenAI from 'openai';

// Embeds only: the MCP client is the model, so there is no chat model here.
export class OpenAIConfig {
    constructor({api_key, embedding_model, embedding_input_max_chars}) {
        this.client = new OpenAI({apiKey: api_key});
        this.embedding_model = embedding_model;
        this.embedding_input_max_chars = embedding_input_max_chars;
    }

    async generate_embedding(text) {
        const response = await this.client.embeddings.create({
            model: this.embedding_model,
            input: text.substring(0, this.embedding_input_max_chars),
        });

        return response.data[0].embedding;
    }
}
