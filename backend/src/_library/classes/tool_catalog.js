import {Tool} from './tool.js';

// A collection rather than an array so duplicate names are rejected in one place - the
// SDK would otherwise silently keep whichever registered last.
export class ToolCatalog {
    constructor(tools = []) {
        this.tools = new Map();

        for (const tool of tools) {
            this.add(tool);
        }
    }

    add(tool) {
        if (!(tool instanceof Tool)) {
            throw new Error('ToolCatalog only accepts Tool instances.');
        }

        if (this.tools.has(tool.name)) {
            throw new Error(`Duplicate tool name "${tool.name}".`);
        }

        this.tools.set(tool.name, tool);

        return this;
    }

    get(name) {
        return this.tools.get(name);
    }

    get size() {
        return this.tools.size;
    }

    register_all(server) {
        for (const tool of this.tools.values()) {
            tool.register(server);
        }
    }

    [Symbol.iterator]() {
        return this.tools.values();
    }
}
