import apiClient from "./client";
import { Place } from "./places";

export type ChatResponse = {
  answer: string;
  type: string;
  session_id: string;
  places: Place[];
};

export type ChatSearchResponse = {
  id: string;
  created_at: string;
  first_message: string;
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

export async function searchChatHistory(
  query: string,
): Promise<ChatSearchResponse[]> {
  const response = await apiClient.get<ChatSearchResponse[]>(
    "/chat/search-history",
    {
      params: { q: query },
    },
  );
  return response.data;
}

export async function getAllRecommendedNames(): Promise<string[]> {
  const response = await apiClient.get<{ names: string[] }>("/chat/all-names");
  return response.data.names;
}
