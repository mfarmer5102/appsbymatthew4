import pytest
from pyspark.sql import SparkSession
from data.jobs.src.copy_down.queries import ApplicationsQuery


@pytest.fixture(scope="session")
def spark():
    return SparkSession.builder.appName("PySpark Test").getOrCreate()


def test_applications_query(spark):
    mock_data = [{
        "title": "Title"
    }]
    mock_df = spark.createDataFrame(data=mock_data)
    df = ApplicationsQuery(spark, df=mock_df).transform()
    assert df.count() > 0

