import uuid
from dotenv import load_dotenv
from services.chat_service import ChatService

load_dotenv()


chat = ChatService()

USER_ID = "test_user"
SESSION_ID = str(uuid.uuid4())

print(f"Session: {SESSION_ID}\n")
print("Wpisz wiadomość (lub 'quit' żeby wyjść)\n")

while True:
    message = input("Ty: ").strip()
    if message.lower() in ("quit", "exit", "q"):
        break
    if not message:
        continue

    response = chat.handle_message(
        user_id=USER_ID,
        session_id=SESSION_ID,
        message=message,
    )

    print(f"\nAsystent: {response.answer}")
    print(f"[typ: {response.enough_context}]")
    if response.recommended_place_names:
        print(f"[polecone: {', '.join(response.recommended_place_names)}]")
    print()
