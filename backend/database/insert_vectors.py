from datetime import datetime
import pandas as pd
from database.vector_store import VectorStore
from timescale_vector.client import uuid_from_time

vec = VectorStore()

df = pd.read_csv("data/warsaw_places.csv", sep=",")
df = df.where(pd.notnull(df), None)


def build_content(row) -> str:
    parts = []

    name = row.get("name", "")
    sub_cat = row.get("sub_category") or ""
    main_cat = row.get("main_category") or ""
    district = row.get("district") or ""
    category_str = f"{sub_cat} ({main_cat})" if sub_cat else main_cat
    parts.append(f"{name} to {category_str} w dzielnicy {district}.")

    summary = row.get("editorial_summary") or ""
    if summary:
        parts.append(summary)

    reviews = row.get("all_reviews") or ""
    if reviews:
        parts.append(f"Opinie: {reviews}")

    return " ".join(parts)


def prepare_record(row):
    content = build_content(row)
    content = " ".join(content.split())
    embedding = vec.get_embedding(content)

    return pd.Series(
        {
            "id": str(uuid_from_time(datetime.now())),
            "metadata": {
                "place_id": row.get("place_id"),
                "name": row.get("name"),
                "address": row.get("address"),
                "address_context": row.get("address_context"),
                "website": row.get("website"),
                "maps_url": row.get("maps_url"),
                "google_maps_direct_link": row.get("google_maps_direct_link"),
                "menu_url": row.get("menu_url"),
                "district": row.get("district"),
                "main_category": row.get("main_category"),
                "sub_category": row.get("sub_category"),
                "primary_type": row.get("primary_type"),
                "lat": row.get("lat"),
                "lon": row.get("lon"),
                "rating": row.get("rating"),
                "user_rating_count": row.get("user_rating_count"),
                "price_level": row.get("price_level"),
                "price_range_start": row.get("price_range_start"),
                "price_range_end": row.get("price_range_end"),
                "opening_hours": row.get("godziny_json"),
                "takeout": row.get("takeout"),
                "dine_in": row.get("dine_in"),
                "reservable": row.get("reservable"),
                "serves_breakfast": row.get("serves_breakfast"),
                "serves_lunch": row.get("serves_lunch"),
                "serves_dinner": row.get("serves_dinner"),
                "serves_dessert": row.get("serves_dessert"),
                "serves_coffee": row.get("serves_coffee"),
                "serves_vegetarian": row.get("serves_vegetarian"),
                "serves_wine": row.get("serves_wine"),
                "serves_beer": row.get("serves_beer"),
                "serves_cocktails": row.get("serves_cocktails"),
                "outdoor_seating": row.get("outdoor_seating"),
                "good_for_groups": row.get("good_for_groups"),
                "live_music": row.get("live_music"),
                "menu_for_children": row.get("menu_for_children"),
                "created_at": datetime.now().isoformat(),
            },
            "contents": content,
            "embedding": embedding,
        }
    )


records_df = df.apply(prepare_record, axis=1)

vec.create_tables()
vec.create_index()
vec.upsert(records_df)
# vec.delete(delete_all=True)
