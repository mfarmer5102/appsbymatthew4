import {postgres_config} from '../configuration/database.js';
import secret_config from '../configuration/secrets.js';
import {OpenAIConfig} from '../_library/classes/openai.js';
import {VectorSearchHelper} from '../_library/classes/vector_search.js';
import {randomBytes} from 'crypto';

const openai_config = new OpenAIConfig(secret_config['OPENAI_API_KEY']);
const vector_search_helper = new VectorSearchHelper(postgres_config);

/**
 * Generate a session ID.
 *
 * Chat is stateless: nothing is persisted between requests, so this identifier only
 * gives the client a stable handle for the current panel session. It is echoed back
 * rather than used to look anything up. Re-introducing multi-turn memory would mean
 * adding a chat history table and reading it here.
 */
function generate_session_id() {
    return `session_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

/**
 * Sanitize user input to prevent injection attacks
 */
function sanitize_input(text) {
    if (!text || typeof text !== 'string') return '';

    // Remove HTML tags
    const sanitized = text.replace(/<[^>]*>/g, '');

    // Limit length
    return sanitized.substring(0, 500).trim();
}

/**
 * Some deployed URLs are stored without a scheme ("www.appsbymatthew.com"), which the
 * browser would resolve as a relative path. Prefix bare hosts so a cited source is
 * always a working link.
 */
function to_absolute_url(url) {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Format sources for response.
 *
 * Reads deployed_url and repository_urls, the columns that actually exist. The previous
 * implementation looked for live_site_url and repo_urls[].url, neither of which was ever
 * present in the data, so every source was dropped by the filter below.
 */
function format_sources(search_results) {
    if (!search_results || search_results.length === 0) return [];

    return search_results
        .map((result) => ({
            title: result.title,
            link: to_absolute_url(result.deployed_url || result.repository_urls?.[0] || null),
            score: result.score,
        }))
        .filter((source) => source.link);
}

/**
 * Main chat handler - send message and get response
 */
export const do_send_message = async (req_objx) => {
    try {
        // Extract and sanitize input
        const raw_message = req_objx.get_req_body('message');
        const user_message = sanitize_input(raw_message);

        // Validate input
        if (!user_message || user_message.length === 0) {
            return {
                message: 'Please provide a message.',
                session_id: null,
                sources: [],
            };
        }

        const session_id = req_objx.get_req_body('session_id') || generate_session_id();

        // Without persistence there is no prior context, so the model sees only the
        // current turn plus whatever vector search surfaces.
        const conversation = [{role: 'user', content: user_message}];

        // Generate embedding for the user's message
        const embedding = await openai_config.generateEmbedding(user_message);

        // Perform vector search
        const search_results = await vector_search_helper.searchApplications(embedding, 5);

        // Generate AI response with context
        const ai_response = await openai_config.generateChatCompletion(conversation, search_results);

        return {
            message: ai_response,
            session_id,
            sources: format_sources(search_results),
        };
    } catch (error) {
        console.error('Chat handler error:', error);

        // Return fallback response on error
        const session_id = req_objx.get_req_body('session_id') || generate_session_id();
        return {
            message: "I'm having trouble right now. Please try again later.",
            session_id,
            sources: [],
            error: true,
        };
    }
};
