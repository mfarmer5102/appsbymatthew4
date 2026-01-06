const handle_lambda_request = require('./_aws_lambda.js').handle_lambda_request;

handle_lambda_request({
    httpMethod: 'GET',
    path: '/api/users/login',
    headers: {},
    queryStringParameters: {},
    body: {},
    state: {}
}, null);