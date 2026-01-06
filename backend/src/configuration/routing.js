import RoutingConfig from '../_library/classes/routing';
import Route from '../_library/classes/routing';

import error_config from '../configuration/errors';

import users from '../controllers/users';
import entries from '../controllers/entries';
import monthly_reports from '../controllers/monthly_reports';
import sources from '../controllers/sources';
import source_types from '../controllers/source_types';

routing_config = new RoutingConfig(
    error_config=error_config, 
    unprotected_routes=[
        //Users
        Route(method="POST", path="/api/users/login", handler=(req_objx) => users.login(req_objx)),
        Route(method="POST", path="/api/users/verify2fa", handler=(req_objx) => users.verify_2fa(req_objx)),
        Route(method="POST", path="/api/users/generate2fa", handler=(req_objx) => users.generate_2fa_setup(req_objx)),
        Route(method="POST", path="/api/users/complete2fa", handler=(req_objx) => users.complete_2fa_setup(req_objx)),
        Route(method="POST", path="/api/users/create", handler=(req_objx) => users.create(req_objx)),
    ],
    protected_routes=[
        //Entries
        Route(method="GET", path="/api/entries/getMany", handler=(req_objx) => entries.get_many(req_objx)),
        Route(method="POST", path="/api/entries/create", handler=(req_objx) => entries.create(req_objx)),
        Route(method="PUT", path="/api/entries/update", handler=(req_objx) => entries.update(req_objx)),
        Route(method="DELETE", path="/api/entries/delete", handler=(req_objx) => entries.delete(req_objx)),
        //Monthly Reports
        Route(method="GET", path="/api/monthlyReports/getMany", handler=(req_objx) => monthly_reports.get_many(req_objx)),
        Route(method="GET", path="/api/monthlyReports/getInstantAmountsBySource", handler=(req_objx) => monthly_reports.get_instance_amounts_by_source(req_objx)),
        Route(method="GET", path="/api/monthlyReports/getInstantAmountsBySourceType", handler=(req_objx) => monthly_reports.get_instance_amounts_by_source_type(req_objx)),
        //Sources
        Route(method="GET", path="/api/sources/getMany", handler=(req_objx) => sources.get_many(req_objx)),
        Route(method="POST", path="/api/sources/create", handler=(req_objx) => sources.create(req_objx)),
        Route(method="PUT", path="/api/sources/update", handler=(req_objx) => sources.update(req_objx)),
        Route(method="PUT", path="/api/sources/archive", handler=(req_objx) => sources.archive(req_objx)),
        Route(method="DELETE", path="/api/sources/delete", handler=(req_objx) => sources.delete(req_objx)),
        //Source Types
        Route(method="GET", path="/api/sourceTypes/getMany", handler=(req_objx) => source_types.get_many(req_objx)),
    ]
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