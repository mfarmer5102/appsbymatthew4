import "./_aws_lambda.js";
import { handle_lambda_request } from "./_aws_lambda.js";

// handle_lambda_request({
//     httpMethod: 'GET',
//     path: "/api/applications",
//     headers: {},
//     queryStringParameters: {
//         title: 'Verdantime I',
//         skip: 0,
//         limit: 1
//     },
//     body: {},
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'POST',
//     path: "/api/applications",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         title: "Test App",
//         publish_date: new Date().toISOString(),
//         associated_skill_codes: ['JSON'],
//         is_featured: false,
//         image_url_relative: "some_url.jpg",
//         deployed_link: "www.levelupmyresume.com",
//         description: "Hello world.",
//         repositories: ['somerepo'],
//         support_status_code: "ACTIVE"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'PUT',
//     path: "/api/applications",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         title: "Test App",
//         publish_date: new Date(),
//         associated_skill_codes: ['JSON'],
//         is_featured: false,
//         image_url_relative: "some_url.jpg",
//         deployed_link: "www.levelupmyresume.com",
//         description: "Hello world.",
//         repositories: ['somerepo'],
//         support_status_code: "ACTIVE"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'DELETE',
//     path: "/api/applications",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         title: "Test App"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });