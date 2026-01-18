import express from 'express';
import cors from 'cors';
import {StandardizedRequestObject} from "./src/_library/classes/requests.js";
import {routing_config} from "./src/configuration/routing.js";
import {error_config} from "./src/configuration/errors.js";
import {middleware_config} from "./src/configuration/middleware.js";
import secret_config from "./src/configuration/secrets.js";

const app = express();

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// TODO: Helmet
// TODO: Rate limiter middleware

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:*',
    'https://www.appsbymatthew.com'
  ],
  credentials: true
}));

const extract_query_params_from_request = (request) => {
  try {
    return request.query;
  }
  catch (e) {
    return null;
  }
}

const extract_req_body_from_request = (request) => {
  try {
    return request.body;
  }
  catch (e) {
    return null;
  }
}

const extract_all_from_request = async (request) => {
  const query_params = extract_query_params_from_request(request);
  const req_body = await extract_req_body_from_request(request);
  const headers = request.headers;
  return [query_params, req_body, headers];
}

const ingest_expressjs_request = async (http_method, path, request) => {
  const [query_params, req_body, headers] = await extract_all_from_request(request)
  return new StandardizedRequestObject(
      http_method,
      path="/" + path,
      headers,
      query_params,
      req_body,
      {}
  )
}

const handle_expressjs_request = async (http_method, path, request) => {
  try {
    const standardized_request_object = await ingest_expressjs_request(http_method, path, request)
    standardized_request_object.path = standardized_request_object.path.replaceAll('//', '/')
    const standardized_response_object = await routing_config.handle_path(
        standardized_request_object,
        secret_config,
        middleware_config
    )
    return {
      'isBase64Encoded': false,
      'statusCode': standardized_response_object.status_code,
      'headers': {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      "multiValueHeaders": {},
      'body': standardized_response_object.res_body,
    }
  }
  catch (e) {
    const [status_code, message] = error_config.prepare_error_notice(e)
    return {
      'isBase64Encoded': false,
      'statusCode': status_code,
      'headers': {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*',
      },
      "multiValueHeaders": {},
      'body': message
    }
  }
}

app.get('*', async (req, res) => {
  const x = await handle_expressjs_request('GET', req.path, req)
  return res.status(x['statusCode']).json(x.body);
})
app.post('*', async (req, res) => {
  const x = await handle_expressjs_request('POST', req.path, req)
  return res.status(x['statusCode']).json(x.body);
})
app.put('*', async (req, res) => {
  const x = await handle_expressjs_request('PUT', req.path, req)
  return res.status(x['statusCode']).json(x.body);
})
app.delete('*', async (req, res) => {
  const x = await handle_expressjs_request('DELETE', req.path, req)
  return res.status(x['statusCode']).json(x.body);
})

const PORT = process.env.PORT || 2021;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});