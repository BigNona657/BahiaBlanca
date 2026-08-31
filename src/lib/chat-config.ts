export const CHAT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos

export type ChatMessage = {
  id: number;
  sender: "client" | "admin";
  text: string;
  created_at: string;
};
