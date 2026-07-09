// Con strategy:"database" no hay JWT en el Edge Runtime.
// La protección de /admin y /orders se maneja en sus layouts con getServerSession.
export function middleware() {}

export const config = {
  matcher: [],
};
