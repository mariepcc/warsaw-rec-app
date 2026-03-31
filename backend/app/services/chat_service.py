import pandas as pd
from config.settings import get_settings
from database.vector_store import VectorStore
from database.chat_repository import ChatRepository
from services.message_classifier import MessageClassifier
from services.metadata_extractor import MetadataExtractor
from services.synthesizer import Synthesizer
from services.chat_models import SynthesizedResponse


class ChatService:
    def __init__(self):
        self.settings = get_settings()
        self.vec = VectorStore()
        self.repo = ChatRepository(self.settings.database.service_url)

    def handle_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
    ) -> SynthesizedResponse:
        self.repo.get_or_create_session(user_id, session_id)
        history = self.repo.get_history(session_id)
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

            search_kwargs = {"limit": extraction.results_limit + 2}
            if predicates is not None:
                search_kwargs["predicates"] = predicates

            context = self.vec.search(expanded_query, **search_kwargs)
            if context is not None and not context.empty:
                self.repo.save_session_context(
                    session_id,
                    context.to_json(orient="records", force_ascii=False),
                )
            print(f"Initial context retrieved: {context}")
            print(f"Context length: {len(context)}")

            context = MetadataExtractor.filter_by_opening_hours(context, extraction)

        elif classification.message_type == "followup":
            print(f"Szukam w sesji: {session_id}")
            context_json = self.repo.get_session_context(session_id)
            if context_json:
                import io

                context = pd.read_json(io.StringIO(context_json), orient="records")
        limit = extraction.results_limit if extraction else 5
        print(f"Number of results to search for: {limit}")
        print(f"Chat history: {history}")

        response = Synthesizer.generate_response(
            question=message,
            chat_history=history,
            context=context,
            results_limit=limit,
        )
        response._context = context

        self.repo.save_message(
            session_id, "user", message, message_type=classification.message_type
        )
        self.repo.save_message(
            session_id,
            "assistant",
            response.answer,
            message_type=classification.message_type,
            recommended_places=response.recommended_place_names,
        )

        return response
