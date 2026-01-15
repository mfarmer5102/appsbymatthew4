import {ErrorConfig} from '../_library/classes/errors.js';

export const error_config = new ErrorConfig([
    {
        "key": "application_already_exists",
        "message": "Application already exists.",
        "status_code": 409
    }
]);