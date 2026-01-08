import {error_config} from './src/configuration/errors.js';
import {routing_config} from './src/configuration/routing.js';
import secret_config from './src/configuration/secrets.js';
import {middleware_config} from './src/configuration/middleware.js';
import {StandardizedRequestObject} from './src/_library/classes/requests.js';

export const handle_lambda_request = async (event, context) => {
// exports.handle_lambda_request = async (event, context) => {
    try {
        const res = await handle_lambda_async_request(event, context);
        return {
            'isBase64Encoded': false,
            'statusCode': res.status_code,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': '*'
            },
            "multiValueHeaders": {},
            'body': JSON.stringify(res.res_body),
        }
    }
    catch (e) {
        const [status_code, message] = error_config.prepare_error_notice(e)
        return {
            'isBase64Encoded': false,
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': '*'
            },
            "multiValueHeaders": {},
            'body': JSON.stringify(message),
        }
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

/*
import asyncio
import json

from src.configuration.errors import error_config
from src.configuration.middleware import middleware_config
from src.configuration.secrets import secret_config
from src.configuration.routing import routing_config
from src._library.classes.requests import StandardizedRequestObject


def handle_lambda_request(event, context):
    try:
        res = asyncio.run(handle_lambda_async_request(event, context))
        return {
            'isBase64Encoded': False,
            'statusCode': res.status_code,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': '*'
            },
            "multiValueHeaders": {},
            'body': json.dumps(res.res_body),
        }
    except Exception as e:
        status_code, message = error_config.prepare_error_notice(e)
        return {
            'isBase64Encoded': False,
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': '*'
            },
            "multiValueHeaders": {},
            'body': json.dumps(message),
        }

async def handle_lambda_async_request(event, context):
    standardized_request_object = ingest_lambda_request(event, context)
    standardized_response_object = await routing_config.handle_path(
        standardized_request_object,
        secret_config=secret_config,
        middleware_config=middleware_config
    )
    return standardized_response_object

def ingest_lambda_request(event, context) -> StandardizedRequestObject:

    # When coming from API Gateway, req_body may need to be converted to a dict
    req_body = event.get('body') if event.get('body') is not None else {}
    if type(req_body == str):
        try:
            req_body = json.loads(req_body)
        except Exception as e:
            print("Couldn't convert req body to JSON")

    # Generate standardized req obj
    return StandardizedRequestObject(
        http_method=event.get('httpMethod'),
        path=event.get('path'),
        headers=event.get('headers'),
        query_string_params=event.get('queryStringParameters') if event.get('queryStringParameters') is not None else {},
        req_body=req_body,
        state={}
    )

*/