import "./_aws_lambda.js";
import { handle_lambda_request } from "./_aws_lambda.js";

///////////////////////////////////////////////////////
////////// APPLICATIONS ////////////
///////////////////////////////////////////////////////

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
//     headers: {
//         "Authorization": `lemon`,
//     },
//     queryStringParameters: {},
//     body: {
//         title: "Some Fake App 3",
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
//     console.log(r);
//     console.log('----------');
//     console.log(JSON.parse(r.body));
// }).catch(e => {
//     console.log(e)
// }).finally(() => {
//     process.exit(0)
// });

// handle_lambda_request({
//     httpMethod: 'PUT',
//     path: "/api/applications",
//     headers: {
//         Authorization: `lemon`,
//     },
//     queryStringParameters: {},
//     body: {
//         title: "Some Fake App",
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
//     console.log(r);
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

///////////////////////////////////////////////////////
////////// SKILLS ////////////
///////////////////////////////////////////////////////

// handle_lambda_request({
//     httpMethod: 'GET',
//     path: "/api/skills",
//     headers: {},
//     queryStringParameters: {
//         skill_type_code: "LANGUAGE",
//         limit: 3
//     },
//     body: {},
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'POST',
//     path: "/api/skills",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         is_proficient: false,
//         name: 'Fake Language',
//         skill_type_code: 'LANGUAGE',
//         code: 'FAKE',
//         is_visible_in_app_details: false
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'PUT',
//     path: "/api/skills",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         is_proficient: true,
//         name: 'Fake Language',
//         skill_type_code: 'LANGUAGE',
//         code: 'FAKE',
//         is_visible_in_app_details: false
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'DELETE',
//     path: "/api/skills",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         code: 'FAKE',
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

///////////////////////////////////////////////////////
////////// SKILL TYPES ////////////
///////////////////////////////////////////////////////

// handle_lambda_request({
//     httpMethod: 'GET',
//     path: "/api/skill-types",
//     headers: {},
//     queryStringParameters: {
//         code: 'CLOUD'
//     },
//     body: {},
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'POST',
//     path: "/api/skill-types",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         label: "Fake",
//         code: "FAKE"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'PUT',
//     path: "/api/skill-types",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         label: "Fakeness",
//         code: "FAKE"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'DELETE',
//     path: "/api/skill-types",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         code: "FAKE"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

///////////////////////////////////////////////////////
////////// SUPPORT STATUS ////////////
///////////////////////////////////////////////////////

// handle_lambda_request({
//     httpMethod: 'GET',
//     path: "/api/support-status",
//     headers: {},
//     queryStringParameters: {
//         code: 'ACTIVE'
//     },
//     body: {},
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'POST',
//     path: "/api/support-status",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         label: "Lost",
//         code: "LOST"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'PUT',
//     path: "/api/support-status",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         label: "Lostness",
//         code: "LOST"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });

// handle_lambda_request({
//     httpMethod: 'DELETE',
//     path: "/api/support-status",
//     headers: {},
//     queryStringParameters: {},
//     body: {
//         code: "LOST"
//     },
//     state: {}
// }, null).then(r => {
//     console.log(JSON.parse(r.body));
//     process.exit(0);
// });