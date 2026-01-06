import MongoConfig from '../_library/classes/mongo';
import MongoColl from '../_library/classes/mongo';
import secret_config from '../configuration/secrets';

mongo_config = new MongoConfig('verdantime', secret_config.MONGO_INSTANCE_URL);

entries_coll = new MongoColl(mongo_config, 'entries');
monthly_reports_coll = new MongoColl(mongo_config, 'monthly_reports');
source_types_coll = new MongoColl(mongo_config, 'source_types');
sources_coll = new MongoColl(mongo_config, 'sources');
users_coll = new MongoColl(mongo_config, 'users');

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