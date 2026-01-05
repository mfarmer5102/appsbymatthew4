// const handle_lambda_request = (event, context) => {
//     return 'hello world';
// }

exports.handle_lambda_request = async (event, context) => {
    // Log the event data for debugging in CloudWatch
    console.log("Received event:", JSON.stringify(event, null, 2));

    // A simple message to be returned
    const message = 'Hello from AWS Lambda!';

    // The response object must follow the structure expected by the invoker (e.g., API Gateway)
    const response = {
        'statusCode': 200,
        'body': JSON.stringify({
            message: message,
            input: event, // Optionally echo the input event
        }),
    };

    // Return the response object
    return response;
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