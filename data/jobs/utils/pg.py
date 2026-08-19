import os

from mfarmer5102_utils.pyspark.postgres import read_from_pg as _read_from_pg
from mfarmer5102_utils.pyspark.postgres import write_to_pg as _write_to_pg

from jobs.utils.environment import supabase_db_url

# Resolve the bundled Supabase CA cert relative to this file's location,
# matching the backend pattern in src/_library/classes/postgres.js.
_default_ca_path = os.path.join(
    os.path.dirname(__file__), os.pardir, os.pardir, os.pardir,
    "backend", "certs", "supabase-prod-ca-2021.crt"
)
_ca_path = os.getenv("PGSSL_ROOT_CERT", _default_ca_path)
_no_verify = os.getenv("PGSSL_NO_VERIFY", "").lower() == "true"


def read_from_pg(spark, sql, params=None):
    return _read_from_pg(
        spark, sql, params=params,
        db_url=supabase_db_url, sslrootcert=_ca_path, no_verify=_no_verify,
    )


def write_to_pg(df, table, delete_sql=None, delete_params=None):
    return _write_to_pg(
        df, table, delete_sql=delete_sql, delete_params=delete_params,
        db_url=supabase_db_url, sslrootcert=_ca_path, no_verify=_no_verify,
    )
