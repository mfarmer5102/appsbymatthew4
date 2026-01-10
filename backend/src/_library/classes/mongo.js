import { MongoClient } from 'mongodb';

export class MongoConfig {
    constructor(database_name, instance_url) {
        this.mongo_client = new MongoClient(instance_url);
        this.database_name = database_name;
        this.database = this.mongo_client.db(this.database_name);
    }
}

export class MongoColl {
    constructor(mongo_config, name) {
        this.db = mongo_config.database;
        this.name = name // Name of standard collection
        this.ref = mongo_config.database.collection(this.name) // Direct ref to standard collection
    }
}