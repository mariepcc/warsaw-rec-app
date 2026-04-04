import apiClient from "./client";

export type Session = {
  id: string;
  created_at: string;
  first_message: string | null;
  message_count: number;
};

export async function getSessions(): Promise<Session[]> {
  const response = await apiClient.get("/sessions/");
  return response.data;
}

export async function getSessionMessages(sessionId: string) {
  const response = await apiClient.get(`/sessions/${sessionId}/messages`);
  return response.data;
}
