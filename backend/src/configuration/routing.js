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

/*
from src.configuration.errors import error_config
from src._library.classes.routing import RoutingConfig, Route
from src.controllers import users, entries, monthly_reports, sources, source_types

routing_config = RoutingConfig(
    error_config=error_config,
    unprotected_routes=[
        # Users
        Route(method="POST", path="/api/users/login", handler=lambda req_objx: users.login(req_objx)),
        Route(method="POST", path="/api/users/verify2fa", handler=lambda req_objx: users.verify_2fa(req_objx)),
        Route(method="POST", path="/api/users/generate2fa", handler=lambda req_objx: users.generate_2fa_setup(req_objx)),
        Route(method="POST", path="/api/users/complete2fa", handler=lambda req_objx: users.complete_2fa_setup(req_objx)),
        Route(method="POST", path="/api/users/create", handler=lambda req_objx: users.create(req_objx)),
    ],
    protected_routes=[
        # Entries
        Route(method="GET", path="/api/entries/getMany", handler=lambda req_objx: entries.get_many(req_objx)),
        Route(method="POST", path="/api/entries/create", handler=lambda req_objx: entries.create(req_objx)),
        Route(method="PUT", path="/api/entries/update", handler=lambda req_objx: entries.update(req_objx)),
        Route(method="DELETE", path="/api/entries/delete", handler=lambda req_objx: entries.delete(req_objx)),
        # Monthly Reports
        Route(method="GET", path="/api/monthlyReports/getMany", handler=lambda req_objx: monthly_reports.get_many(req_objx)),
        Route(method="GET", path="/api/monthlyReports/getInstantAmountsBySource", handler=lambda req_objx: monthly_reports.get_instance_amounts_by_source(req_objx)),
        Route(method="GET", path="/api/monthlyReports/getInstantAmountsBySourceType", handler=lambda req_objx: monthly_reports.get_instance_amounts_by_source_type(req_objx)),
        # Sources
        Route(method="GET", path="/api/sources/getMany", handler=lambda req_objx: sources.get_many(req_objx)),
        Route(method="POST", path="/api/sources/create", handler=lambda req_objx: sources.create(req_objx)),
        Route(method="PUT", path="/api/sources/update", handler=lambda req_objx: sources.update(req_objx)),
        Route(method="PUT", path="/api/sources/archive", handler=lambda req_objx: sources.archive(req_objx)),
        Route(method="DELETE", path="/api/sources/delete", handler=lambda req_objx: sources.delete(req_objx)),
        # Source Types
        Route(method="GET", path="/api/sourceTypes/getMany", handler=lambda req_objx: source_types.get_many(req_objx)),
    ]
)
*/