from data.jobs.utils.connection_mongo import mongo_client


class MongoColl:

    def __init__(self, db, name):
        self.db = db
        # Standard config
        self.name = name
        self.ref = mongo_client[self.db][self.name]
        # Temp config
        self.temp_name = f"{self.name}_temp"
        self.temp_ref = mongo_client[self.db][self.temp_name]
        # Backup config
        self.backup_name = f"{self.name}_backup"
        # Broken config
        self.broken_name = f"{self.name}_broken"

    def convert_primary_to_backup(self):
        try:
            self.ref.rename(self.backup_name, dropTarget=True)
        except Exception as e:
            print(e)
            print("No primary collection to rename.")

    def convert_temp_to_broken(self):
        self.temp_ref.rename(self.broken_name, dropTarget=True)

    def convert_temp_to_primary(self):
        self.temp_ref.rename(self.name, dropTarget=True)


# logs DB
logger_coll = MongoColl("logs", 'jobs')

# appsbymatthew DB
appsbymatthew_db = "apps_by_matthew"
applications_coll = MongoColl(appsbymatthew_db, 'applications')
skill_types_coll = MongoColl(appsbymatthew_db, 'skill_types')
skills_coll = MongoColl(appsbymatthew_db, 'skills')
support_statuses_coll = MongoColl(appsbymatthew_db, 'support_statuses')