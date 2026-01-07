export class MongoConfig {
    constructor(database_name, instance_url) {
        this.mongo_client = pymongo.MongoClient(instance_url, tlsCAFile=certifi.where());
        this.database_name = database_name;
        this.database = this.mongo_client[database_name];
    }
}

export class MongoColl {
    constructor(mongo_config, name) {
        this.db = mongo_config.database_name;
        this.name = name;
    }
    convert_primary_to_backup() {
        try {
            self.ref.rename(self.backup_name, dropTarget=True)
        } catch (e) {
            console.log("No primary collection to rename.");
        }
    }
    convert_temp_to_broken() {
        self.temp_ref.rename(self.broken_name, dropTarget=True)
    }
    convert_temp_to_primary() {
        self.temp_ref.rename(self.name, dropTarget=True)
    }
}

/*

import certifi
import pymongo


class MongoConfig:

    def __init__(self, database_name, instance_url):
        self.mongo_client = pymongo.MongoClient(instance_url, tlsCAFile=certifi.where())
        self.database_name = database_name
        self.database = self.mongo_client[database_name]


class MongoColl:

    def __init__(self, mongo_config, name):
        self.db = mongo_config.database_name
        self.name = name # Name of standard collection
        self.ref = mongo_config.mongo_client[self.db][self.name] # Direct ref to standard collection
        self.temp_name = f"{self.name}_temp" # Name of temp collection
        self.temp_ref = mongo_config.mongo_client[self.db][self.temp_name] # Direct ref to temp collection
        self.backup_name = f"{self.name}_backup" # Name of backup collection
        self.broken_name = f"{self.name}_broken" # Name of broken collection

    def convert_primary_to_backup(self):
        try:
            self.ref.rename(self.backup_name, dropTarget=True)
        except Exception as e:
            print("No primary collection to rename.")

    def convert_temp_to_broken(self):
        self.temp_ref.rename(self.broken_name, dropTarget=True)

    def convert_temp_to_primary(self):
        self.temp_ref.rename(self.name, dropTarget=True)

*/