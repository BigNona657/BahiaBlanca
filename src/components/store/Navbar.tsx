"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";

type Props = {
  businessName: string;
  logoData: string;
  logoSize?: number;
};

export default function Navbar({ businessName, logoData, logoSize = 36 }: Props) {
  const { data: session, status } = useSession();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cartBadge = mounted ? totalItems : 0;
  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {logoData ? (
            <Image
              src={logoData}
              alt={`Logo ${businessName}`}
              width={logoSize}
              height={logoSize}
              className="object-contain rounded-full"
              style={{ width: logoSize, height: logoSize }}
              unoptimized={logoData.startsWith("data:")}
              priority
            />
          ) : null}
          <span className="text-xl font-bold text-brand-600">{businessName}</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/cart" className="relative p-2">
            <span className="text-2xl">🛒</span>
            {cartBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {cartBadge > 99 ? "99+" : cartBadge}
              </span>
            )}
          </Link>

          {/* Zona de sesión — solo se renderiza tras montar para evitar hydration mismatch */}
          <div suppressHydrationWarning>
            {!mounted || status === "loading" ? (
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            ) : session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-brand-500 flex items-center justify-center text-white text-sm font-bold focus:outline-none ring-2 ring-transparent hover:ring-brand-300 transition"
                >
                  {session.user.image ? (
                    <Image src={session.user.image} alt="avatar" width={36} height={36} className="object-cover" />
                  ) : (
                    initials
                  )}
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-800 truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>

                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-600 font-medium hover:bg-brand-50 transition"
                      >
                        <span>⚙️</span> Panel admin
                      </Link>
                    )}

                    <button
                      onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      <span>🚪</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-brand-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-600 transition"
              >
                Ingresar
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
