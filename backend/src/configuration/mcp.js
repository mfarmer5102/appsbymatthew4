// The MCP endpoint app.js mounts at /api/mcp: four read-only tools over the same data
// layer the REST routes use. Adding a tool is a class under src/mcp/tools/ and one
// entry in the catalog below.
import {McpEndpoint} from '../_library/classes/mcp_endpoint.js';
import {ToolCatalog} from '../_library/classes/tool_catalog.js';
import {SITE_ORIGIN} from './http.js';

import {SearchApplicationsTool} from '../mcp/tools/search_applications_tool.js';
import {SearchApplicationsSemanticTool} from '../mcp/tools/search_applications_semantic_tool.js';
import {GetSkillsTool} from '../mcp/tools/get_skills_tool.js';
import {ListLookupsTool} from '../mcp/tools/list_lookups_tool.js';

// max is enforced by each tool's zod schema, so an oversized request never reaches a
// query. All stay within parse_pagination's own ceiling of 200.
const catalog = new ToolCatalog([
    new SearchApplicationsTool({limits: {default: 10, max: 50}}),
    new SearchApplicationsSemanticTool({limits: {default: 5, max: 20}}),
    new GetSkillsTool({limits: {default: 100, max: 200}}),
    new ListLookupsTool(),
]);

export const mcp_endpoint = new McpEndpoint({
    info: {name: 'appsbymatthew-portfolio', version: '2.0.0'},
    catalog,

    // Every tool takes at most three scalar arguments, so this only turns away a
    // pathological payload before any schema runs.
    max_tool_input_elements: 100,

    // How long a client may cache tools/list and server/discover. Both change only
    // with a deploy.
    cache_ttl_ms: 60 * 60 * 1000,

    allowed_origin: SITE_ORIGIN,
});
