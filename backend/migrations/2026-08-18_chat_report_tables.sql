-- Chat report tables.
--
-- The chat_reports Spark job (data/jobs/src/chat_reports) previously wrote its daily
-- output only to S3 as parquet. These two tables give it a queryable home in Supabase
-- too. The job writes both on every run; each run replaces (DELETE + INSERT, not
-- upsert) the rows for its report_date, so reruns for the same day are idempotent.
--
-- Run this against the database, then re-export backend/ddl.sql and run
-- `npm run check-db`.

-- ---------------------------------------------------------------------------
-- chat_report_daily_summary
-- ---------------------------------------------------------------------------
--
-- One row per day. Mirrors compute_daily_summary()'s output columns directly — see
-- data/jobs/src/chat_reports/misc.py.

CREATE TABLE apps_by_matthew.chat_report_daily_summary (
	report_date date NOT NULL,

	total_turns int4 NOT NULL,
	unique_sessions int4 NOT NULL,
	error_count int4 NOT NULL,

	avg_latency_ms float8 NULL,
	total_latency_ms int8 NULL,
	avg_prompt_tokens float8 NULL,
	total_prompt_tokens int8 NULL,
	avg_completion_tokens float8 NULL,
	total_completion_tokens int8 NULL,
	avg_completion_ms float8 NULL,

	-- Request-side timings, averaged from the role='user' rows.
	avg_embedding_ms float8 NULL,
	avg_search_ms float8 NULL,

	created_at timestamptz DEFAULT now() NOT NULL,

	CONSTRAINT chat_report_daily_summary_pkey PRIMARY KEY (report_date)
);

ALTER TABLE apps_by_matthew.chat_report_daily_summary OWNER TO postgres;
GRANT ALL ON TABLE apps_by_matthew.chat_report_daily_summary TO postgres;


-- ---------------------------------------------------------------------------
-- chat_report_top_application
-- ---------------------------------------------------------------------------
--
-- One row per (report_date, application_key) that was surfaced by chat that day.
-- No application_title column, matching bridge_chat_message_application — join to
-- dim_application when a name is needed rather than duplicating it here.

CREATE TABLE apps_by_matthew.chat_report_top_application (
	report_date date NOT NULL,
	application_key int4 NOT NULL,

	times_surfaced int4 NOT NULL,
	avg_similarity_score float4 NOT NULL,

	created_at timestamptz DEFAULT now() NOT NULL,

	CONSTRAINT chat_report_top_application_pkey PRIMARY KEY (report_date, application_key),
	CONSTRAINT chat_report_top_application_application_key_fkey FOREIGN KEY (application_key)
		REFERENCES apps_by_matthew.dim_application(application_key)
);

CREATE INDEX chat_report_top_application_application_key_idx ON apps_by_matthew.chat_report_top_application USING btree (application_key);

ALTER TABLE apps_by_matthew.chat_report_top_application OWNER TO postgres;
GRANT ALL ON TABLE apps_by_matthew.chat_report_top_application TO postgres;
