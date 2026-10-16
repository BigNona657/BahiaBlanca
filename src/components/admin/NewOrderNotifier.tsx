"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUnread } from "@/context/UnreadContext";

type Props = {
  initialCount: number;
  initialLastChatId: number;
};

export default function NewOrderNotifier({ initialCount, initialLastChatId }: Props) {
  const knownCount = useRef<number | null>(null);
  const knownLastChatId = useRef(initialLastChatId);
  const { setUnreadMessages } = useUnread();
  const router = useRouter();
  // AudioContext persistente para desbloquear tras interacción del usuario
  const audioCtx = useRef<AudioContext | null>(null);

  void initialCount;

  // Desbloquear AudioContext en el primer click/tap del usuario
  useEffect(() => {
    const unlock = () => {
      if (!audioCtx.current) {
        audioCtx.current = new AudioContext();
      } else if (audioCtx.current.state === "suspended") {
        audioCtx.current.resume();
      }
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchend", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchend", unlock);
    };
  }, []);

  function getCtx(): AudioContext | null {
    if (!audioCtx.current) {
      try { audioCtx.current = new AudioContext(); } catch { return null; }
    }
    if (audioCtx.current.state === "suspended") {
      audioCtx.current.resume();
    }
    return audioCtx.current;
  }

  function playOrderBeep() {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      [0, 0.35, 0.7].forEach((t) => {
        [880, 1100].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(1.0, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.3);
        });
      });
    } catch {}
  }

  function playChatBeep() {
    try {
      const ctx = getCtx();
      if (!ctx) return;
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
          if (knownCount.current === null) {
            knownCount.current = count;
          } else if (count > knownCount.current) {
            playOrderBeep();
            knownCount.current = count;
            router.refresh();
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
    }, 45000);

    return () => clearInterval(interval);
  }, [setUnreadMessages, router]);

  return null;
}
