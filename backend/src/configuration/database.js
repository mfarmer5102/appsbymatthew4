import secret_config from './secrets.js';
import {PostgresConfig} from '../_library/classes/postgres.js';

// Every table lives in the apps_by_matthew schema rather than public, so queries
// qualify it explicitly instead of relying on search_path.
export const SCHEMA = 'apps_by_matthew';

// dim_application_embedding is keyed on (application_key, model_version), so reads and
// writes must agree on a version string or a second model's vectors would silently
// double every vector-search result. This must match OpenAIConfig.embedding_model.
export const EMBEDDING_MODEL_VERSION = 'text-embedding-3-small';

export const postgres_config = new PostgresConfig(secret_config['SUPABASE_DB_URL']);

export const db = postgres_config;
