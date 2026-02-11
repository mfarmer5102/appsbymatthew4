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
            {
                "key": "admin_code_not_configured",
                "message": "Admin code not configured.",
                "status_code": 500
            }
        ];
        this.custom_errors = custom_errors;
        this.all_errors = this.default_errors.concat(this.custom_errors);
        this.valid_error_keys = this.all_errors.map(error => error.key);
    }
    
    select_error(err_key) {
        if (!this.valid_error_keys.includes(err_key)) {
            console.log(`Warning: Error key ${err_key} not defined.`);
        }
        return err_key;
    }

    prepare_error_notice(e) {
        for (const err of this.all_errors) {
            if (err.key === e['message']) {
                return [err.status_code, err.message];
            }
        }
        return [500, e.toString()];
    }
}