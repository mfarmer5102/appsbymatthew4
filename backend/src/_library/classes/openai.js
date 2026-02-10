import OpenAI from 'openai';
import { error_config } from '../../configuration/errors.js';

export class OpenAIConfig {
    constructor(api_key) {
        this.client = new OpenAI({ apiKey: api_key });
        this.embedding_model = 'text-embedding-3-small'; // 1536 dimensions
        this.chat_model = 'gpt-4o-mini';
    }

    /**
     * Generate embedding vector for text
     * @param {string} text - Text to embed
     * @returns {Promise<Array<number>>} - 1536-dimension embedding vector
     */
    async generateEmbedding(text) {
        try {
            // Truncate text if too long (max ~8000 tokens for this model)
            const truncatedText = text.substring(0, 30000);

            const response = await this.client.embeddings.create({
                model: this.embedding_model,
                input: truncatedText,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('OpenAI embedding generation error:', error);
            throw new Error(error_config.select_error('embedding_generation_failed'));
        }
    }

    /**
     * Generate chat completion with context from vector search
     * @param {Array} conversationHistory - Array of {role, content} messages
     * @param {Array} contextRecords - Array of application records from vector search
     * @returns {Promise<string>} - Assistant's response
     */
    async generateChatCompletion(conversationHistory, contextRecords) {
        try {
            // Format context from vector search results
            const contextText = this._formatContext(contextRecords);

            // Build messages array
            const messages = [
                {
                    role: 'system',
                    content: this._getSystemPrompt(contextText)
                },
                ...conversationHistory
            ];

            const response = await this.client.chat.completions.create({
                model: this.chat_model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI chat completion error:', error);
            throw new Error(error_config.select_error('openai_api_error'));
        }
    }

    /**
     * Format vector search results into context text
     * @private
     */
    _formatContext(contextRecords) {
        if (!contextRecords || contextRecords.length === 0) {
            return 'No specific portfolio projects found for this query.';
        }

        return contextRecords.map((record, index) => {
            return `
                Project ${index + 1}: ${record.title}
                Description: ${record.description || 'No description available'}
                Technologies/Skills: ${record.associated_skill_codes ? record.associated_skill_codes.join(', ') : 'N/A'}
                Support Status: ${record.support_status_code || 'N/A'}
                Featured: ${record.is_featured ? 'Yes' : 'No'}
                ${record.live_site_url ? `Live Site: ${record.live_site_url}` : ''}
                ${record.repo_urls && record.repo_urls.length > 0 ? `Repository: ${record.repo_urls[0].url}` : ''}
            `.trim();
        }).join('\n\n---\n\n');
    }

    /**
     * Get system prompt with context
     * @private
     */
    _getSystemPrompt(contextText) {
        return `
        
        You are a helpful AI assistant for Matthew's portfolio website. You help visitors learn about his projects, skills, and experience.

        IMPORTANT GUIDELINES:
        - Be friendly, professional, and concise
        - If the context doesn't contain relevant information to answer a question, politely say you don't have that information
        - Provide specific details from the projects when available (technologies used, features, status)
        - If asked about contact information or things not in the context, guide users to the appropriate section of the website
        - Keep responses under 200 words unless more detail is specifically requested
        
        CONTEXT (Relevant Portfolio Projects):
        ${contextText}
        
        Answer the user's questions based on this context. Be helpful and conversational!
        
        `;
    }

    /**
     * Batch generate embeddings for multiple texts
     * Useful for initial vectorization of existing records
     * @param {Array<string>} texts - Array of texts to embed
     * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
     */
    async batchGenerateEmbeddings(texts) {
        try {
            // OpenAI allows up to 2048 inputs per request for embeddings
            // We'll batch in groups of 100 to be safe
            const batchSize = 100;
            const results = [];

            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);

                const response = await this.client.embeddings.create({
                    model: this.embedding_model,
                    input: batch,
                });

                results.push(...response.data.map(d => d.embedding));
            }

            return results;
        } catch (error) {
            console.error('OpenAI batch embedding generation error:', error);
            throw new Error(error_config.select_error('embedding_generation_failed'));
        }
    }
}
