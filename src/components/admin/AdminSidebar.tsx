"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin",          label: "Dashboard", icon: "📊" },
  { href: "/admin/orders",   label: "Pedidos",   icon: "📦" },
  { href: "/admin/products", label: "Productos", icon: "🍕" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              active
                ? "bg-brand-500 text-white font-medium"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
      <div>
        <span className="text-base font-bold text-brand-400">BigNona</span>
        <span className="block text-xs text-gray-400">Panel Admin</span>
      </div>
      {/* Botón cerrar — solo mobile */}
      <button
        onClick={() => setOpen(false)}
        className="md:hidden text-gray-400 hover:text-white text-xl leading-none"
      >
        ✕
      </button>
    </div>
  );

  const footer = (
    <div className="px-3 py-4 border-t border-gray-700">
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition"
      >
        <span>🚪</span> Salir
      </button>
    </div>
  );

  return (
    <>
      {/* ── Topbar mobile ── */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 h-12 sticky top-0 z-40">
        <span className="font-bold text-brand-400">BigNona Admin</span>
        <button onClick={() => setOpen(true)} className="text-2xl leading-none">
          ☰
        </button>
      </div>

      {/* ── Overlay mobile ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar desktop / drawer mobile ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-gray-900 text-white flex flex-col z-50
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex
        `}
      >
        {header}
        {navLinks}
        {footer}
      </aside>
    </>
  );
}
