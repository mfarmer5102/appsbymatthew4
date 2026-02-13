from data.jobs.src.copy_down.queries import *
from data.jobs.utils.mongo import *
from data.jobs.utils.environment import lower_env_mongo_uri
from data.jobs.globals.mongo_coll_names import *


def copy_down_applications_collection(spark):   # pragma: no cover
    df = ApplicationsQuery(spark).extract().transform()
    write_to_mongo(df, applications_coll.db, applications_coll.name, "overwrite", uri=lower_env_mongo_uri)


def copy_down_skill_types_collection(spark):  # pragma: no cover
    df = SkillTypesQuery(spark).extract().transform()
    write_to_mongo(df, skill_types_coll.db, skill_types_coll.name, "overwrite", uri=lower_env_mongo_uri)


def copy_down_skills_collection(spark):  # pragma: no cover
    df = SkillsQuery(spark).extract().transform()
    write_to_mongo(df, skills_coll.db, skills_coll.name, "overwrite", uri=lower_env_mongo_uri)


def copy_down_support_statuses_collection(spark):  # pragma: no cover
    df = SupportStatusesQuery(spark).extract().transform()
    write_to_mongo(df, support_statuses_coll.db, support_statuses_coll.name, "overwrite", uri=lower_env_mongo_uri)