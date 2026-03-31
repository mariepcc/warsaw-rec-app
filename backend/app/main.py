from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, sessions, places
from config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Warsaw Rec API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(places.router, prefix="/places", tags=["places"])


@app.get("/health")
def health():
    return {"status": "ok"}
