import {Tool} from '../../_library/classes/tool.js';
import {do_get_many as get_skill_types} from '../../data/skill_types.js';
import {do_get_many as get_support_statuses} from '../../data/support_statuses.js';

// The pagination ceiling; both lists are a handful of rows.
const ALL = {limit: 200};

// Both together: a caller learning what the filters accept wants both.
export class ListLookupsTool extends Tool {
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
            get_skill_types({query: ALL}),
            get_support_statuses({query: ALL}),
        ]);

        return {
            skill_types: skill_types.data.map((row) => row.skill_type),
            support_statuses: support_statuses.data.map((row) => row.support_status),
        };
    }
}
