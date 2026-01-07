export class ErrorConfig {
    constructor(custom_errors=null) {
        if (!custom_errors) custom_errors = [];
        this.default_errors = [
            {
                "key": "bad_request",
                "message": "Bad request.",
                "status_code": 400
            },
            {
                "key": "failed_login",
                "message": "Failed login.",
                "status_code": 401
            },
            {
                "key": "expired_token",
                "message": "Expired token.",
                "status_code": 401
            },
            {
                "key": "invalid_token",
                "message": "Invalid token.",
                "status_code": 401
            },
            {
                "key": "not_found",
                "message": "Not found.",
                "status_code": 404
            },
        ];
        this.custom_errors = custom_errors;
        this.all_errors = this.default_errors.concat(this.custom_errors);
        this.valid_error_keys = this.all_errors.map(error => error.key);
    }
    
    select_error(err_key) {
        if (!this.valid_error_keys.includes(err_key)) {
            console.log(`Warning: Error key ${err_key} not defined.`);
        }
    }

    prepare_error_notice(e) {
        for (const err of this.all_errors) {
            if (err.key === e.toString()) {
                return [err.status_code, err.message];
            }
        }
        return [500, e.toString()];
    }
}

/*
class ErrorConfig:
    def __init__(self, custom_errors=None):
        if custom_errors is None:
            custom_errors = []
        self.default_errors = [
            {
                "key": "bad_request",
                "message": "Bad request.",
                "status_code": 400
            },
            {
                "key": "failed_login",
                "message": "Failed login.",
                "status_code": 401
            },
            {
                "key": "expired_token",
                "message": "Expired token.",
                "status_code": 401
            },
            {
                "key": "invalid_token",
                "message": "Invalid token.",
                "status_code": 401
            },
            {
                "key": "not_found",
                "message": "Not found.",
                "status_code": 404
            },
        ]
        self.custom_errors = custom_errors
        self.all_errors = self.default_errors + self.custom_errors
        self.valid_error_keys = [x.get('key') for x in self.all_errors]

    ### Error notice preparation

    def select_error(self, err_key):
        if err_key not in self.valid_error_keys:
            print("Warning: Error key", err_key, "not defined.")
        return err_key

    def prepare_error_notice(self, e):
        for err in self.all_errors:
            if err.get("key") == str(e):
                return err.get("status_code"), err.get("message")
        return 500, str(e)
*/