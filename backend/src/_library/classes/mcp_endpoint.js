import {createMcpHandler, McpServer} from '@modelcontextprotocol/server';

// One MCP endpoint over Streamable HTTP, exposed as a web-standard
// fetch(Request) => Promise<Response>, which app.js mounts on Express at /api/mcp
// through toNodeHandler. It carries its own CORS policy, since MCP clients need
// headers the site's API does not.
//
// Serves both protocol eras from one URL. 2026-07-28 clients get the stateless
// revision natively; 2025-era clients - still the default in most SDKs - are served
// statelessly from the same factory. See the SDK's protocol-versions guide.
export class McpEndpoint {
    constructor({
        info,
        catalog,
        max_tool_input_elements,
        cache_ttl_ms = 0,
        allowed_origin = null,
    }) {
        this.info = info;
        this.catalog = catalog;
        this.allowed_origin = allowed_origin;

        this.server_options = {
            maxToolInputElements: max_tool_input_elements,

            // 2026-07-28 requires a cache policy on list results; without one the SDK
            // sends ttlMs: 0, telling clients to re-list on every use.
            cacheHints: {
                'tools/list': {ttlMs: cache_ttl_ms, cacheScope: 'public'},
                'server/discover': {ttlMs: cache_ttl_ms, cacheScope: 'public'},
            },
        };

        // The default response mode answers with plain JSON unless a tool emits
        // progress before its result, and none does - so nothing streams, which a
        // buffered Event Function response could not do anyway.
        this.handler = createMcpHandler(() => this.#build_server(), {
            onerror: (error) => console.error('MCP request error:', error),
        });
    }

    // The SDK calls this once per request and keeps nothing between them, so it has to
    // be cheap: the tools, and the pool and clients behind them, are built once by the
    // Container and only registered here.
    #build_server() {
        const server = new McpServer(this.info, this.server_options);
        this.catalog.register_all(server);

        return server;
    }

    // An arrow property so it can be handed around detached, as toNodeHandler does.
    fetch = async (request, options) => {
        const cors_headers = this.#cors_headers(request);

        if (request.method === 'OPTIONS') {
            return new Response(null, {status: 204, headers: cors_headers});
        }

        const response = await this.handler.fetch(request, options);
        const headers = new Headers(response.headers);

        for (const [name, value] of Object.entries(cors_headers)) {
            headers.set(name, value);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };

    // Same policy as backend/_aws_lambda.mjs: reflect the site's own origins, '*' for
    // the rest. An MCP client is not usually a browser, but a browser-based one (the
    // Inspector's web UI) needs this.
    //
    // Allowed headers are reflected rather than listed: a 2026-07-28 client sends
    // Mcp-Method and Mcp-Name on every request, plus an Mcp-Param-* header for each
    // tool argument a schema marks, so no fixed list stays complete.
    #cors_headers(request) {
        const origin = request.headers.get('origin');

        return {
            'Access-Control-Allow-Origin':
                origin && this.allowed_origin?.test(origin) ? origin : '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
                request.headers.get('access-control-request-headers') ||
                'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Method, Mcp-Name',
            'Vary': 'Origin, Access-Control-Request-Headers',
        };
    }

    async close() {
        await this.handler.close();
    }
}
