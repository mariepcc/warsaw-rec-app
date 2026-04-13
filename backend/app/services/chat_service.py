import pandas as pd
import io
from schemas.places import PlaceResponse
from schemas.chat import SynthesizedResponse
from config.settings import get_settings
from database.vector_store import VectorStore
from database.chat_repository import ChatRepository
from database.places_repository import PlacesRepository
from services.message_classifier import MessageClassifier
from services.metadata_extractor import MetadataExtractor
from services.synthesizer import Synthesizer


class ChatService:
    def __init__(self):
        self.settings = get_settings()
        self.vec = VectorStore()
        self.chat_repo = ChatRepository(self.settings.database.service_url)
        self.places_repo = PlacesRepository(self.settings.database.service_url)

    def handle_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
    ) -> SynthesizedResponse:
        self.chat_repo.create_session(user_id, session_id)
        history = self.chat_repo.get_history(session_id)
        classification = MessageClassifier.classify(message, history)

        context = None
        extraction = None

        if classification.message_type in ("rag", "hybrid"):
            query = classification.reformulated_query or message
            print(f"Reformulated query for retrieval: {query}")

            extraction = MetadataExtractor.extract(query)
            predicates = MetadataExtractor.build_predicates(extraction)
            print(f"Cleaned query: {extraction.clean_query}")
            expanded_query = MetadataExtractor.expand_query_with_hyde(
                extraction.clean_query
            )
            print(f"Extracted predicates: {predicates}")
            print(f"Expanded query for retrieval: {expanded_query}")

            buffer = max(5, extraction.results_limit * 2)
            search_kwargs = {"limit": extraction.results_limit + buffer}
            if predicates is not None:
                search_kwargs["predicates"] = predicates

            context = self.vec.search(expanded_query, **search_kwargs)

            context = MetadataExtractor.filter_by_opening_hours(context, extraction)
            available = len(context) if context is not None else 0
            limit = min(max(extraction.results_limit, min(available, 5)), 5)

        elif classification.message_type == "followup":
            context_json = self.chat_repo.get_last_rag_context(session_id)
            if context_json:
                context = pd.read_json(io.StringIO(context_json), orient="records")
                limit = len(context)

        print(f"Number of results to search for: {limit}")

        response = Synthesizer.generate_response(
            question=message,
            chat_history=history,
            context=context,
            results_limit=limit,
            message_type=classification.message_type,
        )

        recommended_places = []
        if response.recommended_place_names and context is not None:
            recommended = set(response.recommended_place_names)
            filtered_df = context[context["name"].isin(recommended)]
            for _, row in filtered_df.iterrows():
                recommended_places.append(
                    PlaceResponse(
                        id=row.get("id"),
                        name=row.get("name"),
                        address=row.get("address"),
                        district=row.get("district"),
                        rating=row.get("rating"),
                        user_rating_count=row.get("user_rating_count"),
                        price_level=row.get("price_level"),
                        maps_url=row.get("maps_url"),
                        menu_url=row.get("menu_url"),
                        main_category=row.get("main_category"),
                        sub_category=row.get("sub_category"),
                        opening_hours=row.get("opening_hours"),
                        serves_vegetarian=row.get("serves_vegetarian"),
                        serves_coffee=row.get("serves_coffee"),
                        serves_beer=row.get("serves_beer"),
                        serves_wine=row.get("serves_wine"),
                        serves_cocktails=row.get("serves_cocktails"),
                        serves_breakfast=row.get("serves_breakfast"),
                        serves_lunch=row.get("serves_lunch"),
                        serves_dinner=row.get("serves_dinner"),
                        serves_dessert=row.get("serves_dessert"),
                        outdoor_seating=row.get("outdoor_seating"),
                        live_music=row.get("live_music"),
                        good_for_groups=row.get("good_for_groups"),
                        menu_for_children=row.get("menu_for_children"),
                        takeout=row.get("takeout"),
                        dine_in=row.get("dine_in"),
                        reservable=row.get("reservable"),
                        lat=row.get("lat"),
                        lon=row.get("lon"),
                        google_maps_direct_link=row.get("google_maps_direct_link"),
                        price_range_end=row.get("price_range_end"),
                        price_range_start=row.get("price_range_start"),
                        editorial_summary=row.get("editorial_summary"),
                    )
                )
        response.recommended_places = recommended_places
        response._context = context

        self.chat_repo.save_message(
            session_id, "user", message, message_type=classification.message_type
        )
        self.chat_repo.save_message(
            session_id,
            "assistant",
            response.answer,
            message_type=classification.message_type,
            recommended_places=[p.model_dump() for p in recommended_places],
        )

        return response
