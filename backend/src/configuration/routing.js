import {RoutingConfig, Route} from '../_library/classes/routing.js';

import {error_config} from './errors.js';

// import users from '../controllers/users';
// import entries from '../controllers/entries';
// import monthly_reports from '../controllers/monthly_reports';
// import sources from '../controllers/sources';
// import source_types from '../controllers/source_types';

export const routing_config = new RoutingConfig(
    [new Route("GET", "/", (req_objx) => 'Hello!')],
    [],
    // [
    //     //Users
    //     Route("POST", "/api/users/login", (req_objx) => users.login(req_objx)),
    //     Route("POST", "/api/users/verify2fa", (req_objx) => users.verify_2fa(req_objx)),
    //     Route("POST", "/api/users/generate2fa", (req_objx) => users.generate_2fa_setup(req_objx)),
    //     Route("POST", "/api/users/complete2fa", (req_objx) => users.complete_2fa_setup(req_objx)),
    //     Route("POST", "/api/users/create", (req_objx) => users.create(req_objx)),
    // ],
    // [
    //     //Entries
    //     Route("GET", "/api/entries/getMany", (req_objx) => entries.get_many(req_objx)),
    //     Route("POST", "/api/entries/create", (req_objx) => entries.create(req_objx)),
    //     Route("PUT", "/api/entries/update", (req_objx) => entries.update(req_objx)),
    //     Route("DELETE", "/api/entries/delete", (req_objx) => entries.delete(req_objx)),
    //     //Monthly Reports
    //     Route("GET", "/api/monthlyReports/getMany", (req_objx) => monthly_reports.get_many(req_objx)),
    //     Route("GET", "/api/monthlyReports/getInstantAmountsBySource", (req_objx) => monthly_reports.get_instance_amounts_by_source(req_objx)),
    //     Route("GET", "/api/monthlyReports/getInstantAmountsBySourceType", (req_objx) => monthly_reports.get_instance_amounts_by_source_type(req_objx)),
    //     //Sources
    //     Route("GET", "/api/sources/getMany", (req_objx) => sources.get_many(req_objx)),
    //     Route("POST", "/api/sources/create", (req_objx) => sources.create(req_objx)),
    //     Route("PUT", "/api/sources/update", (req_objx) => sources.update(req_objx)),
    //     Route("PUT", "/api/sources/archive", (req_objx) => sources.archive(req_objx)),
    //     Route("DELETE", "/api/sources/delete", (req_objx) => sources.delete(req_objx)),
    //     //Source Types
    //     Route("GET", "/api/sourceTypes/getMany", (req_objx) => source_types.get_many(req_objx)),
    // ],
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