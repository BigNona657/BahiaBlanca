"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const links = [
    { href: "/",       label: "Menú",    icon: "🍽️", badge: 0 },
    { href: "/cart",   label: "Carrito", icon: "🛒",  badge: totalItems },
    { href: "/orders", label: "Pedidos", icon: "📦",  badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 md:hidden">
      <div className="flex">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition ${
                active ? "text-brand-600 font-semibold" : "text-gray-400"
              }`}
            >
              <span className="relative text-xl leading-none">
                {link.icon}
                {link.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-brand-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
