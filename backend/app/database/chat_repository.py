from typing import List, Optional
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
    
    
CREATE TABLE IF NOT EXISTS chat_session_context (
    session_id   TEXT PRIMARY KEY REFERENCES chat_sessions(id),
    context_json TEXT NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
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

    def get_or_create_session(self, user_id: str, session_id: str) -> None:
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

    def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        message_type: Optional[str] = None,
        recommended_places: Optional[List[str]] = None,
    ) -> None:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO chat_messages
                        (session_id, role, content, message_type, recommended_places)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        session_id,
                        role,
                        content,
                        message_type,
                        recommended_places,
                    ),
                )

    def get_history(self, session_id: str, limit: int = 20) -> List[ChatMessage]:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT role, content
                    FROM chat_messages
                    WHERE session_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (session_id, limit),
                )
                rows = cur.fetchall()
        return [
            ChatMessage(role=r["role"], content=r["content"]) for r in reversed(rows)
        ]

    def get_last_recommended_places(self, session_id: str) -> List[str]:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT recommended_places
                    FROM chat_messages
                    WHERE session_id = %s
                      AND role = 'assistant'
                      AND recommended_places IS NOT NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (session_id,),
                )
                row = cur.fetchone()
        return row["recommended_places"] if row else []

    def save_session_context(self, session_id: str, context_json: str) -> None:
        """Zapisuje pełny kontekst ostatniego RAG searchu dla sesji."""
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO chat_session_context (session_id, context_json, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (session_id) DO UPDATE
                        SET context_json = EXCLUDED.context_json,
                            updated_at = NOW()
                    """,
                    (session_id, context_json),
                )

    def get_session_context(self, session_id: str) -> str | None:
        """Odczytuje pełny kontekst ostatniego RAG searchu."""
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT context_json FROM chat_session_context WHERE session_id = %s",
                    (session_id,),
                )
                row = cur.fetchone()
        return row["context_json"] if row else None
