from data.jobs.utils.connection_mongo import mongo_db_uri


def write_to_mongo(df, db, coll, save_mode="overwrite", uri=mongo_db_uri):
    df.write \
        .format("com.mongodb.spark.sql.DefaultSource") \
        .mode(save_mode) \
        .option("uri", uri) \
        .option("database", db) \
        .option("collection", coll) \
        .save()
    pass


def read_from_mongo(spark, db, coll, uri=mongo_db_uri):
    df = spark.read \
        .format('com.mongodb.spark.sql.DefaultSource') \
        .option("uri", uri) \
        .option("database", db) \
        .option("collection", coll) \
        .load()
    return df