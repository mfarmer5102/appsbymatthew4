from pyspark.sql.functions import col, current_timestamp
from data.jobs.utils.mongo import read_from_mongo
from data.jobs.utils.environment import upper_env_mongo_uri
from data.jobs.globals.mongo_coll_names import *

class ApplicationsQuery:

    def __init__(self, spark, query_ext="", df=None):
        self.spark = spark
        self.query_ext = query_ext
        self.df = df

    def transform(self):
        self.df = self.df.withColumn("copy_down_timestamp", current_timestamp())
        return self.df

    def extract(self):  # pragma: no cover
        self.df = read_from_mongo(self.spark, applications_coll.db, applications_coll.name, uri=upper_env_mongo_uri)
        return self


class SkillTypesQuery:

    def __init__(self, spark, query_ext="", df=None):
        self.spark = spark
        self.query_ext = query_ext
        self.df = df

    def transform(self):
        self.df = self.df.withColumn("copy_down_timestamp", current_timestamp())
        return self.df

    def extract(self):  # pragma: no cover
        self.df = read_from_mongo(self.spark, skill_types_coll.db, skill_types_coll.name, uri=upper_env_mongo_uri)
        return self


class SkillsQuery:

    def __init__(self, spark, query_ext="", df=None):
        self.spark = spark
        self.query_ext = query_ext
        self.df = df

    def transform(self):
        self.df = self.df.withColumn("copy_down_timestamp", current_timestamp())
        return self.df

    def extract(self):  # pragma: no cover
        self.df = read_from_mongo(self.spark, skills_coll.db, skills_coll.name, uri=upper_env_mongo_uri)
        return self


class SupportStatusesQuery:

    def __init__(self, spark, query_ext="", df=None):
        self.spark = spark
        self.query_ext = query_ext
        self.df = df

    def transform(self):
        self.df = self.df.withColumn("copy_down_timestamp", current_timestamp())
        return self.df

    def extract(self):  # pragma: no cover
        self.df = read_from_mongo(self.spark, support_statuses_coll.db, support_statuses_coll.name, uri=upper_env_mongo_uri)
        return self