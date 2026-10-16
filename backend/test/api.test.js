// Integration tests: the real app against the real database (SUPABASE_DB_URL and
// OPENAI_API_KEY from backend/.env), served on an ephemeral port. Run with `npm test`.
//
// They never write. Every write route is exercised only on paths that are rejected
// before any SQL runs - a bad admin code, or a correct one with a missing field - and
// chat only with an empty message, which returns before calling OpenAI or logging.
import {after, before, describe, test} from 'node:test';
import assert from 'node:assert/strict';
import {config as load_dotenv} from 'dotenv';

import {Client, StreamableHTTPClientTransport} from '@modelcontextprotocol/client';

load_dotenv({quiet: true});

const {app, close_app} = await import('../app.js');

let server;
let base;

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
    server.close();
    await close_app();
});

const get_json = async (path, init) => {
    const response = await fetch(`${base}${path}`, init);
    return {status: response.status, headers: response.headers, body: await response.json()};
};

const write = (method, path, body, headers = {}) => get_json(path, {
    method,
    headers: {'Content-Type': 'application/json', ...headers},
    body: JSON.stringify(body),
});

describe('public reads', () => {
    for (const path of ['/applications', '/skills', '/skill-types', '/support-status']) {
        test(`GET ${path} returns a page`, async () => {
            const {status, body} = await get_json(`${path}?limit=2`);
            assert.equal(status, 200);
            assert.ok(Array.isArray(body.data));
            assert.equal(body.pagination.limit, 2);
        });
    }

    test('applications search matches title or description', async () => {
        const {body: all} = await get_json('/applications?limit=1');
        const word = all.data[0].title.split(' ')[0].toLowerCase();

        const {body} = await get_json(`/applications?search=${encodeURIComponent(word)}`);
        assert.ok(body.data.length > 0);
        for (const row of body.data) {
            assert.ok(`${row.title} ${row.description}`.toLowerCase().includes(word));
        }
    });

    test('skills filter by skill type name', async () => {
        const {body: types} = await get_json('/skill-types?limit=1');
        const skill_type = types.data[0].skill_type;

        const {body} = await get_json(`/skills?skill_type=${encodeURIComponent(skill_type)}`);
        assert.ok(body.data.length > 0);
        assert.ok(body.data.every((row) => row.skill_type === skill_type));
    });
});

describe('admin writes', () => {
    test('rejected without the admin code', async () => {
        const {status, body} = await write('POST', '/skill-types', {skill_type: 'never written'});
        assert.equal(status, 401);
        assert.equal(body, 'Invalid token.');
    });

    test('rejected with a wrong admin code', async () => {
        const {status} = await write('DELETE', '/skills', {skill_key: 1}, {Authorization: 'wrong'});
        assert.equal(status, 401);
    });

    // The correct code reaches validation, which fails on the empty body before any SQL.
    test('accepted with the admin code, whatever its header casing', {
        skip: !process.env.APPSBYMATTHEW_ADMIN_CODE && 'APPSBYMATTHEW_ADMIN_CODE not set',
    }, async () => {
        const {status, body} = await write('POST', '/skill-types', {}, {
            authorization: process.env.APPSBYMATTHEW_ADMIN_CODE,
        });
        assert.equal(status, 400);
        assert.equal(body, 'One or more required fields are missing or invalid.');
    });
});

describe('errors and CORS', () => {
    test('unknown route is a 404', async () => {
        const {status, body} = await get_json('/nope');
        assert.equal(status, 404);
        assert.equal(body, 'Not found.');
    });

    test('malformed JSON is a 400', async () => {
        const response = await fetch(`${base}/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{oops',
        });
        assert.equal(response.status, 400);
    });

    test('an empty chat message is answered without calling OpenAI', async () => {
        const {status, body} = await write('POST', '/chat', {message: ''});
        assert.equal(status, 200);
        assert.equal(body.session_id, null);
    });

    test('the site origin may send the admin header', async () => {
        const response = await fetch(`${base}/applications`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://www.appsbymatthew.com',
                'Access-Control-Request-Method': 'PUT',
                'Access-Control-Request-Headers': 'authorization,content-type',
            },
        });
        assert.equal(response.status, 204);
        assert.equal(response.headers.get('access-control-allow-origin'), 'https://www.appsbymatthew.com');
        assert.match(response.headers.get('access-control-allow-headers'), /Authorization/);
    });

    test('other origins get no CORS grant', async () => {
        const {headers} = await get_json('/skill-types', {headers: {Origin: 'https://evil.example'}});
        assert.equal(headers.get('access-control-allow-origin'), null);
    });
});

// One client per protocol era: pinned to 2026-07-28 so it cannot quietly fall back,
// and a default client, which still opens with the 2025 initialize handshake.
const ERAS = [
    ['2026-07-28', 'modern', {versionNegotiation: {mode: {pin: '2026-07-28'}}}],
    ['2025 (default client)', 'legacy', {}],
];

for (const [label, era, options] of ERAS) {
    describe(`MCP, ${label}`, () => {
        let client;

        before(async () => {
            client = new Client({name: 'api-test', version: '1.0.0'}, options);
            await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
        });

        after(() => client.close());

        test('negotiates the expected era', () => {
            assert.equal(client.getProtocolEra(), era);
        });

        test('lists four read-only tools', async () => {
            const {tools} = await client.listTools();
            assert.deepEqual(tools.map((tool) => tool.name).sort(), [
                'get_skills',
                'list_lookups',
                'search_applications',
                'search_applications_semantic',
            ]);
            assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true));
        });

        const CALLS = [
            ['list_lookups', {}],
            ['search_applications', {limit: 2}],
            ['get_skills', {proficient_only: true, limit: 5}],
            ['search_applications_semantic', {query: 'AI chatbot with vector search', limit: 2}],
        ];

        for (const [name, args] of CALLS) {
            test(`calls ${name}`, async () => {
                const result = await client.callTool({name, arguments: args});
                assert.ok(!result.isError, result.content?.[0]?.text);

                const payload = JSON.parse(result.content[0].text);
                if (Array.isArray(payload)) {
                    assert.ok(payload.length > 0);
                    // Projected for the model: names, never surrogate keys.
                    assert.ok(!('application_key' in payload[0]) && !('skill_key' in payload[0]));
                }
            });
        }

        test('rejects an over-limit argument before running the tool', async () => {
            const result = await client.callTool({name: 'search_applications', arguments: {limit: 999}});
            assert.equal(result.isError, true);
        });
    });
}
