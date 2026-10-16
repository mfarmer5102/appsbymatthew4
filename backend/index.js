// Entry point: a Lambda Web Function's entry file in AWS (the runtime loads index.js
// from the package root), and the dev server locally (`npm run dev`).
//
// It listens before it loads the app. A Web Function must be listening within 10
// seconds of starting, and loading app.js means a Secrets Manager call; requests that
// arrive in the meantime wait for it rather than failing. Loading it dynamically also
// guarantees .env is in process.env before secrets.js reads it.
import {createServer} from 'http';
import {config as load_dotenv} from 'dotenv';

// A no-op in Lambda, which has no .env file.
load_dotenv({quiet: true});

// In a Web Function, Lambda sets AWS_LAMBDA_HTTP_ENDPOINT to the host:port to bind and
// terminates TLS in front of it. Locally it is unset; set PORT to move the server, never
// AWS_LAMBDA_HTTP_ENDPOINT, which is how the code recognizes a Web Function.
const LAMBDA_ENDPOINT = process.env.AWS_LAMBDA_HTTP_ENDPOINT;
const [HOST, PORT] = LAMBDA_ENDPOINT
    ? LAMBDA_ENDPOINT.split(':')
    : [undefined, process.env.PORT || 2021];

const app_module = import('./app.js');

// A failed import is cached for the life of the process, so there is no retrying it.
// Exit instead, and Lambda replaces the environment.
app_module.catch((error) => {
    console.error('Startup failed:', error);
    process.exit(1);
});

const server = createServer((req, res) => {
    app_module.then(({app}) => app(req, res));
});

server.listen(Number(PORT), HOST, () => {
    console.log(`API listening on port ${PORT} (${LAMBDA_ENDPOINT ? 'Lambda Web Function' : 'local'})`);
});

// A Web Function gets 1 second after SIGTERM, so close what is open and nothing more.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        server.close();
        try {
            await (await app_module).close_app();
        } catch (error) {
            console.error('Error during shutdown:', error.message);
        }
        process.exit(0);
    });
}
