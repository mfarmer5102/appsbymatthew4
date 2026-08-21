// The composition root: everything is built here and handed down, so no class below
// imports a singleton.
import {fileURLToPath} from 'url';

import {Environment} from '../_library/classes/environment.js';
import {Configuration} from '../_library/classes/configuration.js';
import {PostgresConfig} from '../_library/classes/postgres.js';
import {OpenAIConfig} from '../_library/classes/openai.js';
import {ToolCatalog} from '../_library/classes/tool_catalog.js';

import {ApplicationRepository} from '../repositories/application_repository.js';
import {SkillRepository} from '../repositories/skill_repository.js';
import {LookupRepository} from '../repositories/lookup_repository.js';

import {SearchApplicationsTool} from '../tools/search_applications_tool.js';
import {SearchApplicationsSemanticTool} from '../tools/search_applications_semantic_tool.js';
import {GetSkillsTool} from '../tools/get_skills_tool.js';
import {ListLookupsTool} from '../tools/list_lookups_tool.js';

// Relative to this file, not process.cwd() - clients spawn the server from anywhere.
const DOTENV_PATH = fileURLToPath(new URL('../../.env', import.meta.url));

export class Container {
    #instances = new Map();

    // Constructing the Environment loads .env, before the Configuration reads any of it.
    // `secrets` is a resolved SecretConfig, passed by _aws_lambda.mjs - see
    // src/configuration/secrets.js and Environment.
    constructor({dotenv_path = DOTENV_PATH, environment = null, secrets = null} = {}) {
        this.environment = environment ?? new Environment(dotenv_path, secrets);
        this.config = new Configuration(this.environment);
    }

    // Built on first use, so a caller wanting only config opens no pool.
    #singleton(key, build) {
        if (!this.#instances.has(key)) {
            this.#instances.set(key, build());
        }

        return this.#instances.get(key);
    }

    get database() {
        return this.#singleton('database', () => new PostgresConfig(this.config.database));
    }

    get openai() {
        return this.#singleton('openai', () => new OpenAIConfig(this.config.openai));
    }

    get applications() {
        return this.#singleton('applications', () => new ApplicationRepository(this.database));
    }

    get skills() {
        return this.#singleton('skills', () => new SkillRepository(this.database));
    }

    get lookups() {
        return this.#singleton('lookups', () => new LookupRepository(this.database));
    }

    // Adding a tool means a class under src/tools/ and one entry here.
    get tool_catalog() {
        return this.#singleton('tool_catalog', () => new ToolCatalog([
            new SearchApplicationsTool({
                applications: this.applications,
                limits: this.config.limits_for('search_applications'),
            }),
            new SearchApplicationsSemanticTool({
                applications: this.applications,
                openai: this.openai,
                limits: this.config.limits_for('search_applications_semantic'),
            }),
            new GetSkillsTool({
                skills: this.skills,
                limits: this.config.limits_for('get_skills'),
            }),
            new ListLookupsTool({lookups: this.lookups}),
        ]));
    }

    get closables() {
        return [this.database];
    }
}
