import secret_config from './secrets.js';
import {OpenAIConfig} from '../_library/classes/openai.js';

// One client for the whole process - the write paths' embeddings, the site's chat, and
// the MCP semantic search all share it.
export const openai_config = new OpenAIConfig(secret_config['OPENAI_API_KEY']);
