from data.jobs.utils.steps import Job, run_job, run_step
from data.jobs.src.copy_down.misc import *


def init(spark):
    job_details = Job(
        job_id="APPSBYMATTHEW-COPY-DOWN",
        job_name="AppsByMatthew Copy Down"
    )
    run_job(spark, job_details, lambda: run(spark, job_details))


def run(spark, job_details):
    run_step(spark, job_details, "COPY-APPLICATIONS", "Copy applications",
             lambda: copy_down_applications_collection(spark))
    run_step(spark, job_details, "COPY-SKILL-TYPES", "Copy skill types",
             lambda: copy_down_skill_types_collection(spark))
    run_step(spark, job_details, "COPY-SKILLS", "Copy skills",
             lambda: copy_down_skills_collection(spark))
    run_step(spark, job_details, "COPY-SUPPORT-STATUSES", "Copy support statuses",
             lambda: copy_down_support_statuses_collection(spark))
