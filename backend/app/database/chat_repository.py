import json
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
from schemas.chat import ChatMessage


CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id          TEXT NOT NULL REFERENCES chat_sessions(id),
    role                TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content             TEXT NOT NULL,
    message_type        TEXT CHECK (message_type IN ('rag', 'followup', 'hybrid')),
    recommended_places  TEXT[],
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_created
    ON chat_messages(session_id, created_at DESC);
"""


class ChatRepository:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self._init_tables()

    def _get_conn(self):
        return psycopg2.connect(self.connection_string)

    def _init_tables(self) -> None:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(CREATE_TABLES_SQL)

    def create_session(self, user_id: str, session_id: str) -> None:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO chat_sessions (id, user_id)
                    VALUES (%s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (session_id, user_id),
                )

    def get_sessions(self, user_id: str) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT 
                        s.id,
                        s.created_at,
                        (
                            SELECT content 
                            FROM chat_messages 
                            WHERE session_id = s.id 
                            AND role = 'user'
                            ORDER BY created_at ASC 
                            LIMIT 1
                        ) as first_message,
                        (
                            SELECT COUNT(*) 
                            FROM chat_messages 
                            WHERE session_id = s.id
                        ) as message_count
                    FROM chat_sessions s
                    WHERE s.user_id = %s::text
                    ORDER BY s.created_at DESC
                    """,
                    (user_id,),
                )
                rows = cur.fetchall()
                return [dict(row) for row in rows]

    def delete_session(self, session_id: str, user_id: str) -> None:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM chat_messages
                    WHERE session_id = %s
                    """,
                    (session_id,),
                )
                cur.execute(
                    """
                    DELETE FROM chat_sessions
                    WHERE id = %s AND user_id = %s
                    """,
                    (session_id, user_id),
                )
            conn.commit()

    def save_message(
        self, session_id, role, content, message_type=None, recommended_places=None
    ):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO chat_messages (session_id, role, content, message_type, recommended_places)
                    VALUES (%s, %s, %s, %s, %s::jsonb)
                    """,
                    (
                        session_id,
                        role,
                        content,
                        message_type,
                        json.dumps(recommended_places) if recommended_places else None,
                    ),
                )

    def get_history(self, session_id: str, limit: int = 20) -> List[ChatMessage]:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT role, content, message_type, recommended_places
                    FROM chat_messages
                    WHERE session_id = %s::text
                    ORDER BY created_at ASC
                    LIMIT %s
                    """,
                    (session_id, limit),
                )
                rows = cur.fetchall()
        return [
            ChatMessage(
                role=r["role"],
                content=r["content"],
                message_type=r.get("message_type"),
                recommended_places=r.get("recommended_places") or [],
            )
            for r in rows
        ]

    def get_last_rag_context(self, session_id: str) -> str | None:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT recommended_places
                    FROM chat_messages
                    WHERE session_id = %s
                    AND role = 'assistant'
                    AND message_type IN ('rag', 'hybrid')
                    AND recommended_places IS NOT NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (session_id,),
                )
                row = cur.fetchone()
        if not row or not row["recommended_places"]:
            return None
        import json

        return json.dumps(row["recommended_places"])
