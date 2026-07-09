import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Con strategy:"database" el token JWT no existe en el Edge.
      // Dejamos pasar siempre; la protección real está en los layouts/pages.
      authorized: () => true,
    },
  }
);

export const config = {
  // Solo interceptamos /admin — /orders se protege en el layout de servidor
  matcher: ["/admin/:path*"],
};
