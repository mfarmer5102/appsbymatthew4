import {z} from 'zod';

// A subclass supplies its getters and implements execute(); this class handles
// registration and the MCP envelope, so the entry point never learns what tools exist.
export class Tool {
    constructor({limits = null} = {}) {
        this.limits = limits;
    }

    get name() {
        throw new Error(`${this.constructor.name} must define a name.`);
    }

    get title() {
        throw new Error(`${this.constructor.name} must define a title.`);
    }

    // Read by the calling model to decide whether to pick this tool. Write it for that
    // reader, not for a human browsing a list.
    get description() {
        throw new Error(`${this.constructor.name} must define a description.`);
    }

    // A zod shape ({field: z.string()}); register() wraps it in z.object(), which the
    // v2 SDK requires.
    get input_schema() {
        return {};
    }

    // Behavior hints a client uses to decide what needs the user's approval. Every tool
    // in this service is a read-only SELECT, so that is the default; a tool that writes
    // must override it.
    get annotations() {
        return {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        };
    }

    // Returns anything JSON-serializable. Throwing is fine - see call().
    async execute(_args) {
        throw new Error(`${this.constructor.name} must implement execute().`);
    }

    // max is enforced here, so an oversized request never reaches a query.
    limit_input() {
        return z
            .number()
            .int()
            .positive()
            .max(this.limits.max)
            .optional()
            .describe(`Maximum rows to return (default ${this.limits.default})`);
    }

    resolve_limit(limit) {
        return limit ?? this.limits.default;
    }

    // isError reports the failure to the model instead of letting the exception kill
    // the request.
    async call(args) {
        try {
            const result = await this.execute(args);

            return {content: [{type: 'text', text: JSON.stringify(result, null, 2)}]};
        } catch (error) {
            console.error(`Tool error (${this.name}):`, error);

            return {
                content: [{type: 'text', text: `Error: ${error.message}`}],
                isError: true,
            };
        }
    }

    register(server) {
        server.registerTool(
            this.name,
            {
                title: this.title,
                description: this.description,
                inputSchema: z.object(this.input_schema),
                annotations: this.annotations,
            },
            (args) => this.call(args),
        );
    }
}
