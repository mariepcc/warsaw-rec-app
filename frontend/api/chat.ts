import apiClient from "./client";

export async function sendMessage(message: string, sessionId?: string) {
  const response = await apiClient.post("/chat/message", {
    message,
    session_id: sessionId,
  });
  return response.data;
}
