import apiClient from "./client";
import { Place } from "./places";

export type ChatResponse = {
  answer: string;
  session_id: string;
  places: Place[];
};

export async function sendMessage(
  message: string,
  sessionId?: string,
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>("/chat/message", {
    message,
    session_id: sessionId,
  });
  return response.data;
}
