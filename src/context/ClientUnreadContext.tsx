"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";

type ClientUnreadCtx = {
  unreadMessages: number;
  setUnreadMessages: Dispatch<SetStateAction<number>>;
};

const noop: Dispatch<SetStateAction<number>> = () => {};
const ClientUnreadContext = createContext<ClientUnreadCtx>({ unreadMessages: 0, setUnreadMessages: noop });

export function ClientUnreadProvider({ children }: { children: ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const lastId = useRef(0);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/orders/unread?since=${lastId.current}`, { cache: "no-store" });
        if (!res.ok) return;
        const { lastId: newLastId, newCount } = await res.json();
        // Guard: solo actualizar estado si realmente hay mensajes nuevos
        if (newLastId > lastId.current && newCount > 0) {
          setUnreadMessages((prev) => prev + newCount);
          lastId.current = newLastId;
        }
      } catch {}
    }

    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ClientUnreadContext.Provider value={{ unreadMessages, setUnreadMessages }}>
      {children}
    </ClientUnreadContext.Provider>
  );
}

export function useClientUnread() {
  return useContext(ClientUnreadContext);
}
