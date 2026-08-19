from jobs.utils.pg import read_from_pg


class ChatMessagesQuery:

    def __init__(self, spark, target_date, df=None):
        self.spark = spark
        self.target_date = target_date
        self.df = df

    def transform(self):
        return self.df

    def extract(self):  # pragma: no cover
        sql = """
            SELECT
                chat_message_key,
                session_id,
                turn_ordinal,
                message_ordinal,
                role,
                content,
                ip_address::text AS ip_address,
                user_agent,
                embedding_model,
                embedding_ms,
                search_ms,
                chat_model,
                prompt_tokens,
                completion_tokens,
                completion_ms,
                latency_ms,
                is_error,
                error_detail,
                created_at
            FROM apps_by_matthew.fact_chat_message
            WHERE created_at >= %(start)s::timestamptz
              AND created_at < %(end)s::timestamptz
        """
        params = {
            "start": f"{self.target_date}T00:00:00Z",
            "end": f"{self.target_date}T00:00:00Z::date + interval '1 day'",
        }
        # Use plain date arithmetic so the interval is computed by Postgres
        sql = """
            SELECT
                chat_message_key,
                session_id,
                turn_ordinal,
                message_ordinal,
                role,
                content,
                ip_address::text AS ip_address,
                user_agent,
                embedding_model,
                embedding_ms,
                search_ms,
                chat_model,
                prompt_tokens,
                completion_tokens,
                completion_ms,
                latency_ms,
                is_error,
                error_detail,
                created_at
            FROM apps_by_matthew.fact_chat_message
            WHERE created_at >= %(start)s::date
              AND created_at < %(start)s::date + interval '1 day'
        """
        params = {"start": str(self.target_date)}
        self.df = read_from_pg(self.spark, sql, params)
        return self


class ChatSourcesQuery:

    def __init__(self, spark, target_date, df=None):
        self.spark = spark
        self.target_date = target_date
        self.df = df

    def transform(self):
        return self.df

    def extract(self):  # pragma: no cover
        sql = """
            SELECT
                b.chat_message_key,
                b.application_key,
                b.similarity_score,
                a.title AS application_title
            FROM apps_by_matthew.bridge_chat_message_application b
            JOIN apps_by_matthew.dim_application a
              ON a.application_key = b.application_key
            JOIN apps_by_matthew.fact_chat_message m
              ON m.chat_message_key = b.chat_message_key
            WHERE m.created_at >= %(start)s::date
              AND m.created_at < %(start)s::date + interval '1 day'
        """
        params = {"start": str(self.target_date)}
        self.df = read_from_pg(self.spark, sql, params)
        return self
