import {MiddlewareConfig} from '../_library/classes/middleware.js';
import secret_config from "./secrets.js";
import {error_config} from "./errors.js";

const validate_provided_code = (req_objx, protected_routes) => {

    const check_if_protected_route = (req_objx, protected_routes) => {
        const http_method = req_objx.http_method;
        const requested_path = req_objx.path;
        for (const route of protected_routes) {
            if (route.method === http_method && route.path === requested_path) {
                return true;
            }
        }
        return false;
    }

    const provided_code = req_objx.get_headers('Authorization')
    const is_protected_route = check_if_protected_route(req_objx, protected_routes)
    if (is_protected_route) {
        if (provided_code !== secret_config['APPSBYMATTHEW_ADMIN_CODE']) {
            throw new Error(error_config.select_error('invalid_token'));
        }
    }
}

export const middleware_config = new MiddlewareConfig([
    validate_provided_code,
]);