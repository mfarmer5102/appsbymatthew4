import {db, SCHEMA} from '../configuration/database.js';

/**
 * Conversation logging for /api/chat.
 *
 * Kept separate from data/chat.js because it is incidental to answering: nothing here
 * feeds the response, and every failure is contained rather than propagated.
 */

/**
 * The applications vector search surfaced, attached to the assistant row.
 *
 * This is the full retrieval set — everything the model was shown — which is a superset
 * of the `sources` the API returns to the client, since format_sources() drops any
 * project without a linkable URL.
 */
async function insert_sources(client, chat_message_key, search_results) {
    if (!Array.isArray(search_results) || search_results.length === 0) return;

    // De-duplicated because the bridge's composite primary key would reject repeats.
    const seen = new Map();
    for (const result of search_results) {
        const application_key = Number(result?.application_key);
        const score = Number(result?.score);
        if (!Number.isInteger(application_key) || !Number.isFinite(score)) continue;
        if (!seen.has(application_key)) seen.set(application_key, score);
    }

    if (seen.size === 0) return;

    await client.query(
        `
        INSERT INTO ${SCHEMA}.bridge_chat_message_application (
            chat_message_key, application_key, similarity_score
        )
        SELECT $1, * FROM UNNEST($2::int[], $3::float4[])
        ON CONFLICT DO NOTHING
        `,
        [chat_message_key, [...seen.keys()], [...seen.values()]],
    );
}

/**
 * Persist one chat turn: the user's message, the assistant's reply, and the context
 * that produced it.
 *
 * Never throws. /api/chat is public and user-facing, and a logging failure must not
 * turn a good answer into the handler's canned apology, so errors are written to the
 * console and swallowed. The trade-off is that a broken log is silent in the response —
 * console output is the only signal.
 *
 * @param {object} turn
 */
export const log_chat_turn = async (turn) => {
    try {
        await db.transaction(async (client) => {
            // Chat is stateless, so the server does not know where in the session it
            // is; the ordinals come from what is already stored. Reading them inside
            // the transaction, plus UNIQUE (session_id, message_ordinal), is what makes
            // that safe if two turns of one session ever overlap — the loser rolls back
            // and its failure is contained by the catch below.
            const {rows: [position]} = await client.query(
                `
                SELECT COALESCE(MAX(turn_ordinal), 0) + 1 AS turn_ordinal,
                       COALESCE(MAX(message_ordinal), 0) + 1 AS message_ordinal
                FROM ${SCHEMA}.fact_chat_message
                WHERE session_id = $1
                `,
                [turn.session_id],
            );

            const turn_ordinal = Number(position.turn_ordinal);
            const message_ordinal = Number(position.message_ordinal);

            // The request side. `content` is the sanitized message, i.e. exactly what
            // the model was shown.
            await client.query(
                `
                INSERT INTO ${SCHEMA}.fact_chat_message (
                    session_id, turn_ordinal, message_ordinal, role, content,
                    ip_address, user_agent, embedding_model, embedding_ms, search_ms
                )
                VALUES ($1, $2, $3, 'user', $4, $5::inet, $6, $7, $8, $9)
                `,
                [
                    turn.session_id,
                    turn_ordinal,
                    message_ordinal,
                    turn.user_message,
                    turn.client?.ip_address ?? null,
                    turn.client?.user_agent ?? null,
                    turn.embedding_model ?? null,
                    turn.embedding_ms ?? null,
                    turn.search_ms ?? null,
                ],
            );

            // The response side, one ordinal later and sharing the turn.
            const {rows: [assistant]} = await client.query(
                `
                INSERT INTO ${SCHEMA}.fact_chat_message (
                    session_id, turn_ordinal, message_ordinal, role, content,
                    chat_model, prompt_tokens, completion_tokens, completion_ms,
                    latency_ms, is_error, error_detail
                )
                VALUES ($1, $2, $3, 'assistant', $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING chat_message_key
                `,
                [
                    turn.session_id,
                    turn_ordinal,
                    message_ordinal + 1,
                    turn.assistant_message,
                    turn.chat_model ?? null,
                    turn.prompt_tokens ?? null,
                    turn.completion_tokens ?? null,
                    turn.completion_ms ?? null,
                    turn.latency_ms ?? null,
                    turn.is_error === true,
                    turn.error_detail ?? null,
                ],
            );

            await insert_sources(client, assistant.chat_message_key, turn.sources);
        });
    } catch (error) {
        console.error('Chat logging failed; the chat response was still returned:', error.message);
    }
};
