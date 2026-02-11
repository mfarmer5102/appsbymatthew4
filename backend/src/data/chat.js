import { chat_history_coll, applications_coll } from '../configuration/mongo.js';
import secret_config from '../configuration/secrets.js';
import { OpenAIConfig } from '../_library/classes/openai.js';
import { VectorSearchHelper } from '../_library/classes/vector_search.js';
import { randomBytes } from 'crypto';

// Initialize OpenAI and Vector Search helpers
const openai_config = new OpenAIConfig(secret_config['OPENAI_API_KEY']);
const vector_search_helper = new VectorSearchHelper(applications_coll);

/**
 * Generate a unique session ID
 */
function generateSessionId() {
    return `session_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

/**
 * Sanitize user input to prevent injection attacks
 */
function sanitizeInput(text) {
    if (!text || typeof text !== 'string') return '';

    // Remove HTML tags
    const sanitized = text.replace(/<[^>]*>/g, '');

    // Limit length
    return sanitized.substring(0, 500).trim();
}

/**
 * Format sources for response
 */
function formatSources(searchResults) {
    if (!searchResults || searchResults.length === 0) return [];

    return searchResults.map(result => ({
        title: result.title,
        link: result.live_site_url || (result.repo_urls && result.repo_urls.length > 0 ? result.repo_urls[0].url : null),
        score: result.score
    })).filter(source => source.link); // Only include sources with links
}

/**
 * Load conversation history for a session
 */
async function loadConversationHistory(session_id, limit = 10) {
    const messages = await chat_history_coll.ref
        .find({ session_id })
        .sort({ created_at: 1 })
        .limit(limit)
        .toArray();

    // Return in OpenAI format: {role, content}
    return messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));
}

/**
 * Store a chat interaction in the database
 */
async function storeChatInteraction(session_id, userMessage, assistantResponse, searchResults) {
    const timestamp = new Date();

    // Store user message
    await chat_history_coll.ref.insertOne({
        session_id,
        role: 'user',
        content: userMessage,
        created_at: timestamp
    });

    // Store assistant response with metadata
    await chat_history_coll.ref.insertOne({
        session_id,
        role: 'assistant',
        content: assistantResponse,
        metadata: {
            sources_count: searchResults ? searchResults.length : 0,
            sources: searchResults ? searchResults.map(r => r.title) : []
        },
        created_at: new Date(timestamp.getTime() + 1) // Ensure assistant message comes after user
    });
}

/**
 * Main chat handler - send message and get response
 */
export const do_send_message = async (req_objx) => {
    try {
        // Extract and sanitize input
        const raw_message = req_objx.get_req_body("message");
        const user_message = sanitizeInput(raw_message);

        // Validate input
        if (!user_message || user_message.length === 0) {
            return {
                message: "Please provide a message.",
                session_id: null,
                sources: []
            };
        }

        // Get or generate session ID
        let session_id = req_objx.get_req_body("session_id");
        if (!session_id) {
            session_id = generateSessionId();
        }

        // Load conversation history
        const conversationHistory = await loadConversationHistory(session_id);

        // Add current user message to history
        conversationHistory.push({
            role: 'user',
            content: user_message
        });

        // Generate embedding for the user's message
        const embedding = await openai_config.generateEmbedding(user_message);

        // Perform vector search
        const searchResults = await vector_search_helper.searchApplications(embedding, 5);

        // Generate AI response with context
        const aiResponse = await openai_config.generateChatCompletion(
            conversationHistory,
            searchResults
        );

        // Store the interaction
        await storeChatInteraction(session_id, user_message, aiResponse, searchResults);

        // Return response
        return {
            message: aiResponse,
            session_id: session_id,
            sources: formatSources(searchResults)
        };

    } catch (error) {
        console.error('Chat handler error:', error);

        // Return fallback response on error
        const session_id = req_objx.get_req_body("session_id") || generateSessionId();
        return {
            message: "I'm having trouble right now. Please try again later.",
            session_id: session_id,
            sources: [],
            error: true
        };
    }
};

/**
 * Get chat history for a session
 */
export const do_get_chat_history = async (req_objx) => {
    const session_id = req_objx.get_query_string_param("session_id");
    const limit = req_objx.get_query_string_param("limit") || 50;
    const offset = req_objx.get_query_string_param("offset") || 0;

    if (!session_id) {
        return {
            data: [],
            pagination: {
                total: 0,
                limit: Number(limit),
                offset: Number(offset)
            }
        };
    }

    const findObj = { session_id };

    const messages = await chat_history_coll.ref
        .find(findObj)
        .sort({ created_at: 1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .toArray();

    const total = await chat_history_coll.ref.countDocuments(findObj);

    return {
        data: messages,
        pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset)
        }
    };
};
