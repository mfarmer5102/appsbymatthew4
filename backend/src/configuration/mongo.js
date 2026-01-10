import {MongoConfig, MongoColl} from '../_library/classes/mongo.js';
import secret_config from "./secrets.js";

const mongo_config = new MongoConfig('apps_by_matthew', secret_config['MONGO_INSTANCE_URL']);

export const applications_coll = new MongoColl(mongo_config, 'applications');
export const skills_coll = new MongoColl(mongo_config, 'skills');
export const skill_types_coll = new MongoColl(mongo_config, 'skill_types');
export const support_statuses_coll = new MongoColl(mongo_config, 'support_statuses');