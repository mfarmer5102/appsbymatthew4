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

    /**
     * Maps a thrown error to [status_code, message] for the response.
     *
     * Only errors this config defines, and client errors Express raised itself (a
     * malformed JSON body, an oversized payload), keep their message. Anything else is
     * an unexpected failure whose message could expose internals - a SQL error, a
     * connection string - so the caller gets a generic 500 and the details go to the log.
     */
    prepare_error_notice(e) {
        for (const err of this.all_errors) {
            if (err.key === e?.message) {
                return [err.status_code, err.message];
            }
        }

        const status = e?.status ?? e?.statusCode;
        if (e?.expose && status >= 400 && status < 500) {
            return [status, e.message];
        }

        return [500, 'Internal server error.'];
    }
}