/**
 * Caller IP and user agent, for request logging.
 *
 * StandardizedRequestObject carries headers but no connection info, and behind App
 * Runner or API Gateway the socket address is the proxy's anyway. Both runtimes do see
 * `x-forwarded-for`, so that is the primary source, with the platform's own view of the
 * peer as a fallback for local development where nothing sets the header.
 *
 * The result goes into the request's `state` bag rather than a new constructor
 * argument, so the two entry points stay the only places that know about the runtime.
 */

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_PATTERN = /^[0-9a-f:.]+$/i;

// Bounded so a hostile client cannot bloat the log table with a megabyte-long header.
const MAX_USER_AGENT_LENGTH = 512;

/**
 * Express lowercases header names; API Gateway passes through whatever the client sent.
 */
const get_header = (headers, name) => {
    if (!headers) return null;
    const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
    return match ? headers[match] : null;
};

/**
 * Normalize one address into something Postgres accepts as `inet`, or null.
 *
 * Invalid input has to become null rather than pass through: `inet` rejects garbage,
 * and a rejected value would cost the whole log row rather than just this column.
 */
export const normalize_ip = (value) => {
    if (!value || typeof value !== 'string') return null;

    let address = value.trim();

    // "[::1]:443" — bracketed IPv6, optionally with a port.
    const bracketed = address.match(/^\[(.+)\](?::\d+)?$/);
    if (bracketed) address = bracketed[1];

    // "1.2.3.4:5678" — only strip a port when there is exactly one colon, since a bare
    // IPv6 address is mostly colons and must be left alone.
    if ((address.match(/:/g) || []).length === 1) address = address.split(':')[0];

    // Node reports IPv4 peers as IPv4-mapped IPv6 ("::ffff:1.2.3.4").
    const mapped = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
    if (mapped) address = mapped[1];

    const ipv4 = address.match(IPV4_PATTERN);
    if (ipv4) {
        return ipv4.slice(1).every((octet) => Number(octet) <= 255) ? address : null;
    }

    // Loose IPv6 check — enough to keep junk out of an inet column without
    // reimplementing the grammar.
    if (address.includes(':') && IPV6_PATTERN.test(address)) return address;

    return null;
};

/**
 * `x-forwarded-for` is "client, proxy1, proxy2" — the leftmost entry is the original
 * caller. It is client-controlled and trivially spoofed, so it is a hint, not evidence.
 */
export const parse_forwarded_for = (value) => {
    if (!value) return null;

    const raw = Array.isArray(value) ? value.join(',') : String(value);
    for (const candidate of raw.split(',')) {
        const normalized = normalize_ip(candidate);
        if (normalized) return normalized;
    }
    return null;
};

/**
 * @param {object} headers - Request headers, in whatever casing the runtime supplies
 * @param {string} [fallback_ip] - The runtime's own view of the peer address
 * @returns {{ip_address: string|null, user_agent: string|null}}
 */
export const extract_client_metadata = (headers, fallback_ip) => {
    const user_agent = get_header(headers, 'user-agent');

    return {
        ip_address:
            parse_forwarded_for(get_header(headers, 'x-forwarded-for')) ??
            normalize_ip(fallback_ip),
        user_agent:
            typeof user_agent === 'string'
                ? user_agent.substring(0, MAX_USER_AGENT_LENGTH)
                : null,
    };
};
