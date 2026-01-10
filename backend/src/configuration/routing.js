import {RoutingConfig, Route} from '../_library/classes/routing.js';

import {error_config} from './errors.js';
import * as applications from "../controllers/applications.js";
import * as skillTypes from "../controllers/skill_types.js";
import * as skills from "../controllers/skills.js";
import * as supportStatuses from "../controllers/support_statuses.js";

export const routing_config = new RoutingConfig(
    [
        new Route("GET", "/api/applications", (req_objx) => applications.get_many(req_objx), true),
        new Route("GET", "/api/skill-types", (req_objx) => skillTypes.get_many(req_objx), true),
        new Route("GET", "/api/skills", (req_objx) => skills.get_many(req_objx), true),
        new Route("GET", "/api/support-status", (req_objx) => supportStatuses.get_many(req_objx), true),
    ],
    [
        // Applications
        new Route("POST", "/api/applications", (req_objx) => applications.create(req_objx), true),
        new Route("PUT", "/api/applications", (req_objx) => applications.update(req_objx), true),
        new Route("DELETE", "/api/applications", (req_objx) => applications.delete_one(req_objx), true),
        // Skill Types
        new Route("POST", "/api/skill-types", (req_objx) => skillTypes.create(req_objx), true),
        new Route("PUT", "/api/skill-types", (req_objx) => skillTypes.update(req_objx), true),
        new Route("DELETE", "/api/skill-types", (req_objx) => skillTypes.delete_one(req_objx), true),
        // Skills
        new Route("POST", "/api/skills", (req_objx) => skills.create(req_objx), true),
        new Route("PUT", "/api/skills", (req_objx) => skills.update(req_objx), true),
        new Route("DELETE", "/api/skills", (req_objx) => skills.delete_one(req_objx), true),
        // Support Statuses
        new Route("POST", "/api/support-status", (req_objx) => supportStatuses.create(req_objx), true),
        new Route("PUT", "/api/support-status", (req_objx) => supportStatuses.update(req_objx), true),
        new Route("DELETE", "/api/support-status", (req_objx) => supportStatuses.delete_one(req_objx), true),
    ],
    error_config,
);