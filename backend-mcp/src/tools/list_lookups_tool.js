import {Tool} from '../_library/classes/tool.js';

// Both together: a caller learning what the filters accept wants both.
export class ListLookupsTool extends Tool {
    constructor({lookups}) {
        super();
        this.lookups = lookups;
    }

    get name() {
        return 'list_lookups';
    }

    get title() {
        return 'List lookup values';
    }

    get description() {
        return (
            'List every skill type and support status used across the portfolio. ' +
            'Useful for discovering the values the other tools accept as filters.'
        );
    }

    async execute() {
        const [skill_types, support_statuses] = await Promise.all([
            this.lookups.skill_types(),
            this.lookups.support_statuses(),
        ]);

        return {skill_types, support_statuses};
    }
}
