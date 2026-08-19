from datetime import date, timedelta

from mfarmer5102_utils.pyspark.arg_parsing import arg_parse_helper


def get_target_date_from_args():
    yesterday = str(date.today() - timedelta(days=1))
    val = arg_parse_helper(
        arg_key="targetDate=",
        default_value=yesterday,
        err_message="No target date provided. Defaulting to yesterday."
    )
    return date.fromisoformat(val)
