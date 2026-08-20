import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

// Transport is injected rather than baked in - stdio is what a desktop client launches,
// but nothing here depends on it.
export class PortfolioMcpServer {
    constructor({info, catalog, closables = []}) {
        this.info = info;
        this.catalog = catalog;
        this.closables = closables;
        this.server = new McpServer(info);
        this.started = false;
    }

    async start(transport) {
        if (this.started) {
            throw new Error('Server already started.');
        }

        this.catalog.register_all(this.server);
        this.install_signal_handlers();

        await this.server.connect(transport);
        this.started = true;

        return this;
    }

    // Or a connection dangles against the pooler when the client restarts us.
    install_signal_handlers() {
        for (const signal of ['SIGINT', 'SIGTERM']) {
            process.on(signal, async () => {
                await this.shutdown();
                process.exit(0);
            });
        }
    }

    // Best-effort: one failure should not strand the rest.
    async shutdown() {
        for (const closable of this.closables) {
            try {
                await closable.close();
            } catch (error) {
                console.error('Error during shutdown:', error.message);
            }
        }
    }
}
