# Warsaw Places RAG Chatbot

A **Retrieval-Augmented Generation (RAG)** chatbot for recommending places in **Warsaw**, combining semantic vector search with large language model–based response generation.

The project demonstrates how embeddings stored in **PostgreSQL (TimescaleDB + pgvector)** can be used to retrieve relevant places and generate context-aware recommendations.

**All example queries and results are presented in the Jupyter notebook.**

---

## Features

- Semantic place search using vector embeddings
- PostgreSQL / TimescaleDB with `pgvector`
- Metadata-based filtering with predicates (rating, popularity, district)
- Natural language response synthesis using an LLM
- Detection of irrelevant or insufficient context
- End-to-end RAG pipeline demonstrated in a notebook

---

## Architecture

- **VectorStore**
  - Handles embedding creation and vector similarity search in PostgreSQL
- **Synthesizer**
  - Generates natural language answers based on retrieved context
  - Handles irrelevant questions gracefully
- **Data Source**
  - Google Places API (reviews, ratings, categories, metadata)

---

## How to Run

1. Install project dependencies mentioned in `requirements.txt`,
2. Configure environment variables (`OPENAI_API_KEY`, database credentials)
3. Open and run the Jupyter notebook to explore the examples

---

## Tech Stack

- Python
- PostgreSQL / TimescaleDB
- pgvector
- Docker
- OpenAI API (embeddings and chat)
- Pandas
- Jupyter Notebook
