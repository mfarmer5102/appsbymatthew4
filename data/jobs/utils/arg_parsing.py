import sys


def arg_parse_helper(arg_key, default_value, err_message):
    val_to_return = default_value
    args = sys.argv[1:]
    try:
        for elem in args:
            if arg_key in elem:
                val_to_return = elem.split("=")[1]
    except Exception as e:
        if e:
            print(e)
        else:
            print(err_message)
    return val_to_return


def get_job_name_from_args():
    return arg_parse_helper(
        arg_key="jobName=",
        default_value=None,
        err_message="No job name provided."
    )


def get_start_step_from_args():
    return int(arg_parse_helper(
        arg_key="startStep=",
        default_value=0,
        err_message="No start step provided. Starting from beginning."
    ))
