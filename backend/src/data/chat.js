import {postgres_config} from '../configuration/database.js';
import secret_config from '../configuration/secrets.js';
import {OpenAIConfig} from '../_library/classes/openai.js';
import {VectorSearchHelper} from '../_library/classes/vector_search.js';
import {log_chat_turn} from './chat_log.js';
import {randomBytes} from 'crypto';

const openai_config = new OpenAIConfig(secret_config['OPENAI_API_KEY']);
const vector_search_helper = new VectorSearchHelper(postgres_config);

const FALLBACK_MESSAGE = "I'm having trouble right now. Please try again later.";

/**
 * Generate a session ID.
 *
 * Chat is stateless: turns are written to fact_chat_message but never read back, so the
 * model still sees only the current message. This identifier groups a session's rows in
 * the log and gives the client a stable handle for the current panel session; it is
 * echoed back rather than used to look anything up. Re-introducing multi-turn memory
 * would mean reading that log here and replaying it into `conversation` below.
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
    const started_at = Date.now();

    // Extract and sanitize input
    const raw_message = req_objx.get_req_body('message');
    const user_message = sanitize_input(raw_message);

    // Validate input. Nothing was asked and nothing was generated, so there is no turn
    // to log.
    if (!user_message || user_message.length === 0) {
        return {
            message: 'Please provide a message.',
            session_id: null,
            sources: [],
        };
    }

    // Resolved once, outside the try, so the error path reports the same session the
    // successful path would have.
    const session_id = req_objx.get_req_body('session_id') || generate_session_id();
    const client_metadata = req_objx.get_state('client') ?? {};

    // Each stage is timed separately: a slow turn is almost always one of the three,
    // and the totals alone do not say which.
    const metrics = {embedding_ms: null, search_ms: null, completion_ms: null};

    // Declared out here so a failure part-way through still logs whatever context had
    // been retrieved by then.
    let search_results = [];

    try {
        // Without persistence there is no prior context, so the model sees only the
        // current turn plus whatever vector search surfaces.
        const conversation = [{role: 'user', content: user_message}];

        // Generate embedding for the user's message
        const embedding_started_at = Date.now();
        const embedding = await openai_config.generateEmbedding(user_message);
        metrics.embedding_ms = Date.now() - embedding_started_at;

        // Perform vector search
        const search_started_at = Date.now();
        search_results = await vector_search_helper.searchApplications(embedding, 5);
        metrics.search_ms = Date.now() - search_started_at;

        // Generate AI response with context
        const completion_started_at = Date.now();
        const completion = await openai_config.generateChatCompletion(conversation, search_results);
        metrics.completion_ms = Date.now() - completion_started_at;

        // Awaited rather than fired and forgotten: Lambda freezes the runtime once the
        // response is returned, so a detached write would be lost there.
        await log_chat_turn({
            session_id,
            user_message,
            assistant_message: completion.content,
            client: client_metadata,
            embedding_model: openai_config.embedding_model,
            chat_model: completion.model,
            prompt_tokens: completion.prompt_tokens,
            completion_tokens: completion.completion_tokens,
            latency_ms: Date.now() - started_at,
            is_error: false,
            error_detail: null,
            sources: search_results,
            ...metrics,
        });

        return {
            message: completion.content,
            session_id,
            sources: format_sources(search_results),
        };
    } catch (error) {
        console.error('Chat handler error:', error);

        // Logged too, and flagged: without is_error these rows would be
        // indistinguishable from a real answer that happened to be unhelpful.
        await log_chat_turn({
            session_id,
            user_message,
            assistant_message: FALLBACK_MESSAGE,
            client: client_metadata,
            embedding_model: openai_config.embedding_model,
            chat_model: openai_config.chat_model,
            prompt_tokens: null,
            completion_tokens: null,
            latency_ms: Date.now() - started_at,
            is_error: true,
            error_detail: error.message,
            sources: search_results,
            ...metrics,
        });

        // Return fallback response on error
        return {
            message: FALLBACK_MESSAGE,
            session_id,
            sources: [],
            error: true,
        };
    }
};
