"use client";

import React, { createContext, useContext, useState } from "react";

type UnreadCtx = {
  unreadMessages: number;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
};

const UnreadContext = createContext<UnreadCtx>({ unreadMessages: 0, setUnreadMessages: () => {} as React.Dispatch<React.SetStateAction<number>> });

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
