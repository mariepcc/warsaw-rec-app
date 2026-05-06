# SpotGuide 

An AI-powered mobile app for discovering the best places in Warsaw. Ask in natural language and get personalized recommendations for restaurants, cafes, culture, and nightlife.

---

## Demo

> *Coming soon*

---

## Features

- **AI Chat** — ask anything in natural language, get curated place recommendations
- **Interactive Map** — explore venues by category with smart clustering
- **Favourites** — save places and filter by category, price, and district
- **Semantic Search** — finds places based on vibe, not just keywords
- **Secure Auth** — JWT-based authentication via AWS Cognito

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, TypeScript |
| Backend | FastAPI, Python |
| AI | OpenAI GPT-4o, instructor, RAG pipeline |
| Auth | AWS Cognito |
| Database | PostgreSQL, TimescaleDB, pgvector |
| Infrastructure | AWS ECS Fargate, Terraform |

---

## How It Works

The app uses a **RAG (Retrieval-Augmented Generation)** pipeline:

1. User sends a message in natural language
2. Message is **classified** — new query, follow-up, or hybrid
3. **Metadata is extracted** — district, price range, opening hours, category
4. Query is **expanded** using HyDE (Hypothetical Document Embeddings)
5. **Vector search** finds matching venues with metadata filters
6. LLM **synthesizes** results into a conversational response

---

## Project Structure

```
├── frontend/
│   ├── app/            # Expo Router screens
│   ├── components/     # UI components
│   ├── api/            # API client (Axios)
│   └── store/          # Zustand state management
│
└── backend/
    ├── routers/        # API endpoints
    ├── services/       # Chat service, RAG pipeline, LLM
    ├── database/       # Repositories, vector store
    └── schemas/        # Pydantic models
```

---

## Getting Started

### Requirements

- Node.js 18+
- Python 3.11+
- PostgreSQL with pgvector
- AWS account (Cognito)
- OpenAI API key

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn main:app --reload
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env   # fill in your values
npx expo start
```

---

## Environment Variables

```bash
# backend/.env
COGNITO_REGION=eu-north-1
COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
DATABASE_URL=postgresql://user:password@localhost:5432/spotguide
OPENAI_API_KEY=
```

---

## Security

- RS256 JWT validation with JWKS key rotation
- Per-user data isolation on all endpoints
- Input validation via Pydantic on all requests
- Tested against [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Infrastructure

Deployed on AWS using Terraform:

- **ECS Fargate** — containerized backend, no server management
- **RDS PostgreSQL** — managed database
- **ECR** — Docker image registry
- **ALB** — HTTPS load balancer with SSL via ACM
- **Route 53** — DNS management

---

## License

MIT
