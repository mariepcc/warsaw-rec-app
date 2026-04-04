import json
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from schemas.places import PlaceResponse, SavedPlaceResponse

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS saved_places (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    session_id    TEXT,
    name          TEXT NOT NULL,
    address       TEXT,
    district      TEXT,
    rating        FLOAT,
    user_rating_count FLOAT,
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
                            (id, user_id, session_id, name, address, district,
                            rating, user_rating_count, price_level, website, maps_url, menu_url, main_category,
                            sub_category, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (user_id, name) DO NOTHING
                        RETURNING id
                        """,
                        (
                            place.id,
                            user_id,
                            session_id,
                            place.name,
                            place.address,
                            place.district,
                            place.rating,
                            place.user_rating_count,
                            place.price_level,
                            place.website,
                            place.maps_url,
                            place.menu_url,
                            place.main_category,
                            place.sub_category,
                            json.dumps(metadata),
                        ),
                    )

    def delete_place(self, user_id: str, place_id: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM saved_places
                    WHERE user_id = %s AND id = %s
                    RETURNING id
                    """,
                    (user_id, place_id),
                )
                return cur.fetchone() is not None

    def get_saved_places(
        self,
        user_id: str,
        category: Optional[str] = None,
    ) -> List[SavedPlaceResponse]:
        with self._get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        id::text,
                        user_id,
                        session_id,
                        name,
                        address,
                        district,
                        rating,
                        user_rating_count,
                        price_level,
                        website,
                        maps_url,
                        menu_url,
                        main_category,
                        sub_category,
                        is_favourite,
                        created_at,
                        metadata->>'opening_hours' as opening_hours,
                        metadata->>'website' as website,
                        metadata->>'google_maps_direct_link' as google_maps_direct_link,
                        metadata->>'menu_url' as menu_url,
                        (metadata->>'lat')::float as lat,
                        (metadata->>'lon')::float as lon,
                        (metadata->>'price_range_start')::float as price_range_start,
                        (metadata->>'price_range_end')::float as price_range_end,
                        (metadata->>'serves_vegetarian')::boolean as serves_vegetarian,
                        (metadata->>'serves_coffee')::boolean as serves_coffee,
                        (metadata->>'serves_beer')::boolean as serves_beer,
                        (metadata->>'serves_wine')::boolean as serves_wine,
                        (metadata->>'serves_cocktails')::boolean as serves_cocktails,
                        (metadata->>'serves_breakfast')::boolean as serves_breakfast,
                        (metadata->>'serves_lunch')::boolean as serves_lunch,
                        (metadata->>'serves_dinner')::boolean as serves_dinner,
                        (metadata->>'serves_dessert')::boolean as serves_dessert,
                        (metadata->>'outdoor_seating')::boolean as outdoor_seating,
                        (metadata->>'live_music')::boolean as live_music,
                        (metadata->>'good_for_groups')::boolean as good_for_groups,
                        (metadata->>'menu_for_children')::boolean as menu_for_children,
                        (metadata->>'reservable')::boolean as reservable,
                        (metadata->>'dine_in')::boolean as dine_in,
                        (metadata->>'takeout')::boolean as takeout
                    FROM saved_places
                    WHERE user_id = %s
                """
                params = [user_id]
                if category:
                    query += " AND main_category = %s"
                    params.append(category)
                query += " ORDER BY created_at DESC"
                cur.execute(query, params)
                rows = cur.fetchall()
                return [dict(row) for row in rows]

    def mark_as_favourite(self, user_id: str, place_id: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE saved_places
                    SET is_favourite = NOT is_favourite
                    WHERE user_id = %s AND id = %s
                    RETURNING is_favourite
                    """,
                    (user_id, place_id),
                )
                row = cur.fetchone()
        return row[0]

    def is_favourite(self, user_id: str, place_id: str) -> bool:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                SELECT is_favourite
                FROM saved_places
                WHERE user_id = %s AND id = %s
                """,
                    (user_id, place_id),
                )
                row = cur.fetchone()
                return bool(row[0])
