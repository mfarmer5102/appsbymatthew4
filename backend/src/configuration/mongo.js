import {MongoConfig, MongoColl} from '../_library/classes/mongo.js';
import secret_config from "./secrets.js";

const mongo_config = new MongoConfig('apps_by_matthew', secret_config['MONGO_INSTANCE_URL']);

export const applications_coll = new MongoColl(mongo_config, 'applications');
export const skills_coll = new MongoColl(mongo_config, 'skills');
export const skill_types_coll = new MongoColl(mongo_config, 'skill_types');
export const support_statuses_coll = new MongoColl(mongo_config, 'support_statuses');

/*
from src.configuration.secrets import secret_config
from src._library.classes.mongo import MongoConfig, MongoColl

##########################################
###### Mongo Client / Database  ##########
##########################################

mongo_config = MongoConfig('verdantime', secret_config.MONGO_INSTANCE_URL)

##########################################
###### Collections #######################
##########################################

entries_coll = MongoColl(mongo_config, 'entries')
monthly_reports_coll = MongoColl(mongo_config, 'monthly_reports')
source_types_coll = MongoColl(mongo_config, 'source_types')
sources_coll = MongoColl(mongo_config, 'sources')
users_coll = MongoColl(mongo_config, 'users')
*/