import {ErrorConfig} from '../_library/classes/errors.js';

export const error_config = new ErrorConfig([
    {
        "key": "application_already_exists",
        "message": "Application already exists.",
        "status_code": 409
    }
]);

/*
from src._library.classes.errors import ErrorConfig

error_config = ErrorConfig([
    {
        "key": "source_already_exists",
        "message": "Source already exists.",
        "status_code": 409
    },
    {
        "key": "source_has_balance",
        "message": "Source has a balance above zero.",
        "status_code": 403
    },
])
*/