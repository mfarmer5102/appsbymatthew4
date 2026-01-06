class Route {
    constructor(method, path, handler, is_async=False) {
        this.method = method;
        this.path = path;
        this.handler = handler;
        this.is_async = is_async;
    }
}

class RoutingConfig {
    constructor(unprotected_routes, protected_routes, error_config) {
        this.unprotected_routes = unprotected_routes;
        this.protected_routes = protected_routes;
        this.error_config = error_config;
    }

    async handle_path(req_objx, secret_config, middleware_config) {
        protected_routes = this.protected_routes;
        unprotected_routes = this.unprotected_routes;
        for (const mid_func of middleware_config.middleware_funcs) {
            mid_func(req_objx, protected_routes, unprotected_routes, secret_config);
        }

        all_routes = unprotected_routes + protected_routes;
        for (const item of all_routes) {
            if (item.method == req_objx.http_method && item.path == req_objx.path) {
                if (item.is_async) {
                    return await item.handler(req_objx);
                } else {
                    return item.handler(req_objx);
                }
            }
        }

        throw new Exception(this.error_config.select_error("not_found"));
    }
}

/*
from src._library.classes.middleware import MiddlewareConfig
from src._library.classes.requests import StandardizedRequestObject
from src._library.classes.secrets import SecretConfig


class Route:

    def __init__(self, method, path, handler, is_async=False):
        self.method = method
        self.path = path
        self.handler = handler
        self.is_async = is_async


class RoutingConfig:

    def __init__(self, unprotected_routes, protected_routes, error_config):
        self.unprotected_routes = unprotected_routes
        self.protected_routes = protected_routes
        self.error_config = error_config

    async def handle_path(
            self,
            req_objx: StandardizedRequestObject,
            secret_config: SecretConfig,
            middleware_config: MiddlewareConfig
    ):

        protected_routes = self.protected_routes
        unprotected_routes = self.unprotected_routes

        # Apply middleware functions here
        for mid_func in middleware_config.middleware_funcs:
            mid_func(
                req_objx,
                protected_routes,
                unprotected_routes,
                secret_config
            )

        # Then proceed with handling the request
        all_routes = unprotected_routes + protected_routes
        for item in all_routes:
            if item.method == req_objx.http_method and item.path == req_objx.path:
                if item.is_async:
                    return await item.handler(req_objx)
                else:
                    return item.handler(req_objx)

        raise Exception(self.error_config.select_error("not_found"))
*/