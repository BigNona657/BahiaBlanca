"use client";

import { useEffect, useRef } from "react";
import { useUnread } from "@/context/UnreadContext";

type Props = {
  initialCount: number;
  initialLastChatId: number;
};

export default function NewOrderNotifier({ initialCount, initialLastChatId }: Props) {
  const knownCount = useRef(initialCount);
  const knownLastChatId = useRef(initialLastChatId);
  const { setUnreadMessages } = useUnread();

  function playOrderBeep() {
    try {
      const ctx = new AudioContext();
      [0, 0.35, 0.7].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.25);
      });
    } catch {}
  }

  function playChatBeep() {
    try {
      const ctx = new AudioContext();
      [{ f: 660, t: 0 }, { f: 520, t: 0.25 }].forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.2);
      });
    } catch {}
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [ordersRes, chatRes] = await Promise.all([
          fetch("/api/admin/orders/count", { cache: "no-store" }),
          fetch(`/api/admin/chat/unread?since=${knownLastChatId.current}`, { cache: "no-store" }),
        ]);

        if (ordersRes.ok) {
          const { count } = await ordersRes.json();
          if (count > knownCount.current) {
            playOrderBeep();
            knownCount.current = count;
          }
        }

        if (chatRes.ok) {
          const { lastId, newCount } = await chatRes.json();
          if (lastId > knownLastChatId.current) {
            playChatBeep();
            setUnreadMessages((prev) => prev + newCount);
            knownLastChatId.current = lastId;
          }
        }
      } catch {}
    }, 15000);

    return () => clearInterval(interval);
  }, [setUnreadMessages]);

  return null;
}
