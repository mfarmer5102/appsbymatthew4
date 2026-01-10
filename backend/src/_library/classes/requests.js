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

/*
class StandardizedRequestObject:
    def __init__(
            self,
            http_method,
            path,
            headers,
            query_string_params,
            req_body,
            state,
            # form_data,
            # file
    ):
        self.http_method = http_method
        self.path = path
        self.headers = headers
        self.query_string_params = query_string_params
        self.req_body =req_body
        self.state = state
        # self.form_data = form_data,
        # self.file = file

    def get_headers(self, key):
        try:
            return self.headers[key]
        except Exception as e:
            return None

    def get_query_string_param(self, key):
        try:
            return self.query_string_params[key]
        except Exception as e:
            return None

    def get_req_body(self, key):
        try:
            return self.req_body.get(key)
        except Exception as e:
            return None

    # def get_form_data(self, key):
    #     try:
    #         return self.form_data[key]
    #     except Exception as e:
    #         return None
    #
    # def get_file_one(self):
    #     try:
    #         return self.file
    #     except Exception as e:
    #         return None

    def get_state(self, key):
        try:
            return self.state[key]
        except Exception as e:
            return None

    def set_state(self, key, value):
        try:
            if self.state is None: self.state = {}
            self.state[key] = value
            return
        except Exception as e:
            return None
*/