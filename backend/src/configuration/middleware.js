import {timingSafeEqual} from 'crypto';
import {rateLimit, ipKeyGenerator} from 'express-rate-limit';

import secret_config from './secrets.js';
import {error_config} from './errors.js';
import {extract_client_metadata} from '../_library/functions/client_metadata.js';

/**
 * Resolves the caller's IP and user agent once, into res.locals.client, for the rate
 * limiters and the chat log. See client_metadata.js for why x-forwarded-for is read
 * directly instead of through Express's 'trust proxy'.
 */
export const attach_client = (req, res, next) => {
    res.locals.client = extract_client_metadata(req.headers, req.socket?.remoteAddress);
    next();
};

// Constant-time, so response timing does not reveal how much of a guess was right.
const codes_match = (provided, expected) => {
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Guards every write route. req.get() matches the header case-insensitively; the old
 * lookup of headers['Authorization'] never matched on Express, which lowercases names.
 */
export const require_admin_code = (req, res, next) => {
    const expected = secret_config['APPSBYMATTHEW_ADMIN_CODE'];
    if (!expected) {
        throw new Error(error_config.select_error('admin_code_not_configured'));
    }

    const provided = req.get('authorization');
    if (!provided || !codes_match(provided, expected)) {
        throw new Error(error_config.select_error('invalid_token'));
    }

    next();
};

/**
 * Per-client request limits, counted per execution environment: each environment
 * keeps its own in-memory counts, so the effective ceiling scales with how many
 * environments are running. Cap those with the endpoint's maxEnvironments.
 *
 * The key is the caller's IP as attach_client resolved it. x-forwarded-for can be
 * spoofed, so this slows a casual flood rather than stopping a determined one.
 */
const per_minute = (limit) => rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // ipKeyGenerator groups an IPv6 address by its /56, so rotating through one
    // allocation does not reset the count.
    keyGenerator: (req, res) => {
        const ip = res.locals.client?.ip_address;
        return ip ? ipKeyGenerator(ip) : 'unknown';
    },
    // Keyed on our own x-forwarded-for parse above, not req.ip, so this library's
    // check that 'trust proxy' is set for that header does not apply.
    validate: {xForwardedForHeader: false},
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json('Too many requests.');
    },
});

// Every /api request. Generous: the site's pages make a few calls each.
export const api_rate_limit = per_minute(300);

// Each chat message costs an embedding and a completion.
export const chat_rate_limit = per_minute(10);

// An agent makes several tool calls per question; only semantic search costs anything.
export const mcp_rate_limit = per_minute(60);
