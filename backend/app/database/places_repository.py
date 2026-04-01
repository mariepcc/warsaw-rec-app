import json
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from schemas.places import PlaceResponse

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS saved_places (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       TEXT NOT NULL,
    session_id    TEXT,
    name          TEXT NOT NULL,
    address       TEXT,
    district      TEXT,
    rating        FLOAT,
    price_level   TEXT,
    website       TEXT,
    maps_url      TEXT,
    menu_url      TEXT,
    main_category TEXT,
    sub_category  TEXT,
    is_favourite   BOOLEAN DEFAULT FALSE,
    metadata      JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);
"""


class PlacesRepository:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self._init_tables()

    def _get_conn(self):
        return psycopg2.connect(self.connection_string)

    def _init_tables(self):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(CREATE_TABLE_SQL)

    def save_places(
        self,
        user_id: str,
        places: List[PlaceResponse],
        session_id: Optional[str] = None,
    ) -> None:
        for place in places:
            metadata = {
                "opening_hours": place.opening_hours,
                "website": place.website,
                "lat": place.lat,
                "lon": place.lon,
                "price_range_start": place.price_range_start,
                "price_range_end": place.price_range_end,
                "google_maps_direct_link": place.google_maps_direct_link,
                "serves_vegetarian": place.serves_vegetarian,
                "serves_coffee": place.serves_coffee,
                "serves_beer": place.serves_beer,
                "serves_wine": place.serves_wine,
                "serves_cocktails": place.serves_cocktails,
                "serves_breakfast": place.serves_breakfast,
                "serves_lunch": place.serves_lunch,
                "serves_dinner": place.serves_dinner,
                "serves_dessert": place.serves_dessert,
                "outdoor_seating": place.outdoor_seating,
                "live_music": place.live_music,
                "good_for_groups": place.good_for_groups,
                "menu_for_children": place.menu_for_children,
                "takeout": place.takeout,
                "dine_in": place.dine_in,
                "reservable": place.reservable,
            }
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO saved_places
                            (user_id, session_id, name, address, district,
                            rating, price_level, website, maps_url, menu_url, main_category,
                            sub_category, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (user_id, name) DO NOTHING
                        RETURNING id
                        """,
                        (
                            user_id,
                            session_id,
                            place.name,
                            place.address,
                            place.district,
                            place.rating,
                            place.price_level,
                            place.website,
                            place.maps_url,
                            place.menu_url,
                            place.main_category,
                            place.sub_category,
                            json.dumps(metadata),
                        ),
                    )

    def delete_place(self, user_id: str, place_name: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM saved_places
                    WHERE user_id = %s AND name = %s
                    RETURNING id
                    """,
                    (user_id, place_name),
                )
                return cur.fetchone() is not None

    def get_saved_places(
        self,
        user_id: str,
        category: Optional[str] = None,
    ) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT * FROM saved_places
                    WHERE user_id = %s
                """
                params = [user_id]
                if category:
                    query += " AND main_category = %s"
                    params.append(category)
                query += " ORDER BY created_at DESC"
                cur.execute(query, params)
                return cur.fetchall()

    def is_saved(self, user_id: str, place_name: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT 1 FROM saved_places
                    WHERE user_id = %s AND name = %s
                    """,
                    (user_id, place_name),
                )
                return cur.fetchone() is not None

    def mark_as_favourite(self, user_id: str, place_name: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE saved_places
                    SET is_favourite = NOT is_favourite
                    WHERE user_id = %s AND name = %s
                    RETURNING is_favourite
                    """,
                    (user_id, place_name),
                )
                row = cur.fetchone()
        return row[0]

    def is_favourite(self, user_id: str, place_name: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                SELECT is_favourite
                FROM saved_places
                WHERE user_id = %s AND name = %s
                """,
                    (user_id, place_name),
                )
            row = cur.fetchone()
        return bool(row[0])
