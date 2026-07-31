"use client";

import { createContext, useContext, useState } from "react";

type UnreadCtx = {
  unreadMessages: number;
  setUnreadMessages: (n: number) => void;
};

const UnreadContext = createContext<UnreadCtx>({ unreadMessages: 0, setUnreadMessages: () => {} });

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  return (
    <UnreadContext.Provider value={{ unreadMessages, setUnreadMessages }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
