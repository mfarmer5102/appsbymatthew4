import {ErrorConfig} from '../_library/classes/errors.js';

export const error_config = new ErrorConfig([
    {
        "key": "application_already_exists",
        "message": "Application already exists.",
        "status_code": 409
    },
    {
        "key": "missing_required_field",
        "message": "One or more required fields are missing or invalid.",
        "status_code": 400
    },
    {
        "key": "invalid_reference",
        "message": "Request references a record that does not exist.",
        "status_code": 400
    },
    {
        "key": "application_not_found",
        "message": "Application not found.",
        "status_code": 404
    },
    {
        "key": "skill_not_found",
        "message": "Skill not found.",
        "status_code": 404
    },
    {
        "key": "skill_type_not_found",
        "message": "Skill type not found.",
        "status_code": 404
    },
    {
        "key": "support_status_not_found",
        "message": "Support status not found.",
        "status_code": 404
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