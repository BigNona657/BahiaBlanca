"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";

const OrderStreamContext = createContext<EventSource | null>(null);

export function OrderStreamProvider({
  orderId,
  children,
}: {
  orderId: number;
  children: ReactNode;
}) {
  const esRef = useRef<EventSource | null>(null);

  if (!esRef.current && typeof window !== "undefined") {
    esRef.current = new EventSource(`/api/orders/${orderId}/stream`);
  }

  useEffect(() => {
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, []);

  return (
    <OrderStreamContext.Provider value={esRef.current}>
      {children}
    </OrderStreamContext.Provider>
  );
}

export function useOrderStream() {
  return useContext(OrderStreamContext);
}
