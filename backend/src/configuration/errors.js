import {ErrorConfig} from '../_library/classes/errors.js';

export const error_config = new ErrorConfig([
    {
        "key": "application_already_exists",
        "message": "Application already exists.",
        "status_code": 409
    },
    {
        "key": "openai_api_error",
        "message": "Failed to communicate with AI service.",
        "status_code": 502
    },
    {
        "key": "embedding_generation_failed",
        "message": "Failed to generate query embedding.",
        "status_code": 500
    },
    {
        "key": "vector_search_failed",
        "message": "Failed to search knowledge base.",
        "status_code": 500
    }
]);