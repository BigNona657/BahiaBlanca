"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";

type UnreadCtx = {
  unreadMessages: number;
  setUnreadMessages: Dispatch<SetStateAction<number>>;
};

const noop: Dispatch<SetStateAction<number>> = () => {};

const UnreadContext = createContext<UnreadCtx>({ unreadMessages: 0, setUnreadMessages: noop });

export function UnreadProvider({ children }: { children: ReactNode }) {
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
