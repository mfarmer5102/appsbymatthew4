import secret_config from './src/configuration/secrets.js';
import {error_config} from './src/configuration/errors.js';
import {routing_config} from './src/configuration/routing.js';
import {middleware_config} from './src/configuration/middleware.js';
import {StandardizedRequestObject} from './src/_library/classes/requests.js';

// const secret_config = require('./src/configuration/secrets.js');
// const error_config = require('./src/configuration/errors.js').error_config;
// const routing_config = require('./src/configuration/routing.js').routing_config;
// const middleware_config = require('./src/configuration/middleware.js').middleware_config;
// const StandardizedRequestObject = require('./src/_library/classes/requests.js').StandardizedRequestObject;

// Reflect the request's Origin so both appsbymatthew.com and www.appsbymatthew.com work.
const cors_headers = (event) => {
    const headers = event['headers'] || {};
    const origin = headers['origin'] || headers['Origin'];
    return {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': /^https:\/\/(www\.)?appsbymatthew\.com$/.test(origin) ? origin : '*',
    };
};

export const handle_lambda_request = async (event, context) => {
//     console.log('hi')
// exports.handle_lambda_request = async (event, context) => {
    // Answer CORS preflight requests directly — they must return a 2xx status.
    if (event['httpMethod'] === 'OPTIONS') {
        return {
            'isBase64Encoded': false,
            'statusCode': 204,
            'headers': cors_headers(event),
            "multiValueHeaders": {},
            'body': '',
        };
    }

    try {
        const res = await handle_lambda_async_request(event, context);
        return {
            'isBase64Encoded': false,
            'statusCode': res.status_code,
            'headers': cors_headers(event),
            "multiValueHeaders": {},
            'body': JSON.stringify(res.res_body),
        };
    }
    catch (e) {
        const [status_code, message] = error_config.prepare_error_notice(e)
        return {
            'isBase64Encoded': false,
            'statusCode': status_code,
            'headers': cors_headers(event),
            "multiValueHeaders": {},
            'body': JSON.stringify(message),
        };
    }
};

const handle_lambda_async_request = async (event, context) => {
    const standardized_request_object = ingest_lambda_request(event, context)
    // Return the standardized_response_object
    return await routing_config.handle_path(
        standardized_request_object,
        secret_config,
        middleware_config
    );
}

const ingest_lambda_request = (event, context) => {

    // When coming from API Gateway, req_body may need to be converted to a dict
    let req_body = event['body'];
    if (typeof req_body === 'string') {
        try {
            req_body = JSON.parse(event.body);
        }
        catch (e) {
            console.log("Couldn't convert req body to JSON");
        }
    }

    // Generate standardized req obj
    return new StandardizedRequestObject(
        event['httpMethod'],
        event['path'],
        event['headers'],
        event['queryStringParameters'] || {},
        req_body,
        {}
    );
};