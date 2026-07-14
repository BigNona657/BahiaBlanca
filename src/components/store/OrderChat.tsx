"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getChatMessages, sendChatMessage, type ChatMessage } from "@/lib/actions/chat";

const CHAT_EXPIRY_MS = 45 * 60 * 1000;
const POLL_INTERVAL = 5_000;

type Props = {
  orderId: number;
  orderCreatedAt: string;
  senderRole: "client" | "admin";
};

export default function OrderChat({ orderId, orderCreatedAt, senderRole }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calcular expiración
  useEffect(() => {
    function update() {
      const elapsed = Date.now() - new Date(orderCreatedAt).getTime();
      const remaining = CHAT_EXPIRY_MS - elapsed;
      if (remaining <= 0) {
        setExpired(true);
        setTimeLeft("Expirado");
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [orderCreatedAt]);

  // Polling de mensajes
  useEffect(() => {
    async function fetchMessages() {
      const msgs = await getChatMessages(orderId);
      setMessages(msgs);
    }
    fetchMessages();
    if (expired) return;
    const t = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [orderId, expired]);

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || expired) return;
    const text = input;
    setInput("");
    startTransition(async () => {
      await sendChatMessage(orderId, text);
      const msgs = await getChatMessages(orderId);
      setMessages(msgs);
    });
    inputRef.current?.focus();
  }

  const isExpiringSoon = !expired && timeLeft !== "" && parseInt(timeLeft) < 5;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">💬 Chat del pedido</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          expired
            ? "bg-gray-100 text-gray-400"
            : isExpiringSoon
            ? "bg-red-50 text-red-500"
            : "bg-green-50 text-green-600"
        }`}>
          {expired ? "Chat cerrado" : `⏱ ${timeLeft}`}
        </span>
      </div>

      {/* Mensajes */}
      <div className="flex flex-col gap-2 p-4 overflow-y-auto" style={{ minHeight: 160, maxHeight: 320 }}>
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            {expired ? "El chat expiró sin mensajes." : "Aún no hay mensajes. ¡Escribí el primero!"}
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender === senderRole;
          const time = new Date(msg.created_at).toLocaleTimeString("es-AR", {
            hour: "2-digit", minute: "2-digit",
          });
          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                isOwn
                  ? "bg-brand-500 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 px-1">
                {msg.sender === "admin" ? "Local" : "Vos"} · {time}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {expired ? (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            El chat estuvo disponible por 45 minutos desde la creación del pedido.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí un mensaje..."
            maxLength={500}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-semibold transition"
          >
            {isPending ? "..." : "Enviar"}
          </button>
        </form>
      )}
    </div>
  );
}
