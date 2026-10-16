import {Router} from 'express';

import {require_admin_code, chat_rate_limit} from './middleware.js';
import * as applications from '../controllers/applications.js';
import * as skill_types from '../controllers/skill_types.js';
import * as skills from '../controllers/skills.js';
import * as support_statuses from '../controllers/support_statuses.js';
import * as chat from '../controllers/chat.js';

// Mounted at /api by app.js. /api/mcp is mounted separately, ahead of the body parser,
// because the MCP handler reads the raw request itself.
export const api_router = Router();

// Public reads
api_router.get('/applications', applications.get_many);
api_router.get('/skill-types', skill_types.get_many);
api_router.get('/skills', skills.get_many);
api_router.get('/support-status', support_statuses.get_many);

// Chat (stateless for the model - turns are logged but never read back)
api_router.post('/chat', chat_rate_limit, chat.send_message);

// Admin writes: every one requires the admin code in the Authorization header.
api_router.post('/applications', require_admin_code, applications.create);
api_router.post('/applications/vectorize', require_admin_code, applications.vectorize);
api_router.put('/applications', require_admin_code, applications.update);
api_router.delete('/applications', require_admin_code, applications.delete_one);

api_router.post('/skill-types', require_admin_code, skill_types.create);
api_router.put('/skill-types', require_admin_code, skill_types.update);
api_router.delete('/skill-types', require_admin_code, skill_types.delete_one);

api_router.post('/skills', require_admin_code, skills.create);
api_router.put('/skills', require_admin_code, skills.update);
api_router.delete('/skills', require_admin_code, skills.delete_one);

api_router.post('/support-status', require_admin_code, support_statuses.create);
api_router.put('/support-status', require_admin_code, support_statuses.update);
api_router.delete('/support-status', require_admin_code, support_statuses.delete_one);
