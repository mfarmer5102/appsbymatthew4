import "./_aws_lambda.js";
import { handle_lambda_request } from "./_aws_lambda.js";

handle_lambda_request({
    httpMethod: 'GET',
    path: "/api/support-status",
    headers: {},
    queryStringParameters: {},
    body: {},
    state: {}
}, null).then(r => {
    console.log(JSON.parse(r.body));
});