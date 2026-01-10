export class StandardizedRequestObject {
    constructor(http_method, path, headers, query_string_params, req_body, state) {
        this.http_method = http_method;
        this.path = path;
        this.headers = headers;
        this.query_string_params = query_string_params;
        this.req_body = req_body;
        this.state = state;
    }

    get_headers(key) {
        try {
            return this.headers[key];
        } catch (e) {
            return null;
        }
    }

    get_query_string_param(key) {
        try {
            return this.query_string_params[key];
        } catch (e) {
            return null;
        }
    }

    get_req_body(key) {
        try {
            return this.req_body[key];
        } catch (e) {
            return null;
        }
    }

    get_state(key) {
        try {
            return this.state[key];
        } catch (e) {
            return null;
        }
    }

    set_state(key, value) {
        try {
            if (!this.state) this.state = {};
            this.state[key] = value;
            return;
        } catch (e) {
            return null;
        }
    }
}