"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { data: session } = useSession();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-brand-600">
          BigNona
        </Link>

        <nav className="flex items-center gap-3">
          {/* Botón carrito con badge */}
          <Link href="/cart" className="relative p-2">
            <span className="text-2xl">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-sm text-brand-600 font-medium hidden md:block"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-500 hover:text-gray-800 hidden md:block"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-brand-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-600 transition"
            >
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
