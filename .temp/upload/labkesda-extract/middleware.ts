import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "labkesda-garut-lis-secret-key-2026-change-me");
const COOKIE_NAME = "labkesda_session";

const PUBLIC_PATHS = ["/", "/login", "/daftar-online", "/cek-hasil", "/api/auth/login", "/api/auth/logout", "/api/online-registrations", "/api/cek-hasil", "/api/seed", "/api/health"];

// Endpoint aplikasi mobile pasien: auth-nya memakai Bearer JWT sendiri
// (src/lib/patient-auth.ts), BUKAN cookie session staff — maka dilepas dari
// middleware session staff dan diverifikasi di dalam masing-masing route.
function isPublic(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) return true;
  if (pathname.startsWith("/api/patient-auth")) return true;
  if (pathname.startsWith("/api/patient/")) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || (p === "/api/online-registrations" && pathname === p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Allow public POST to /api/online-registrations only
  if (pathname === "/api/online-registrations" && request.method === "POST") return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
