import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const DEBUG = true; // ubah ke false kalau sudah selesai debugging

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStudentRoute = pathname.startsWith("/student");
  const isUmkmRoute = pathname.startsWith("/umkm");
  const isAdminRoute = pathname.startsWith("/admin");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!isStudentRoute && !isUmkmRoute && !isAdminRoute && !isOnboardingRoute) {
    return NextResponse.next();
  }

  // Auth.js v5 butuh salt = nama cookie, dan nama cookie beda di http vs https.
  const secure = request.nextUrl.protocol === "https:";
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: secure,
    salt: cookieName,
  });

  const role = (token?.role as string | null | undefined) ?? null;
  const status = (token?.status as string | null | undefined) ?? null;

  if (DEBUG) {
    console.log("[proxy]", pathname, "| token:", !!token, "| role:", role, "| status:", status);
  }

  const redirectTo = (path: string, search?: Record<string, string>) => {
    // Jangan pernah redirect ke halaman yang sama (cegah loop)
    if (path === pathname) return NextResponse.next();
    const url = new URL(path, request.url);
    if (search) {
      for (const [k, v] of Object.entries(search)) url.searchParams.set(k, v);
    }
    if (DEBUG) console.log("[proxy] redirect ->", url.pathname + url.search);
    return NextResponse.redirect(url);
  };

  // Belum login
  if (!token) {
    const as = isStudentRoute ? "student" : isUmkmRoute ? "umkm" : null;
    return redirectTo("/login", {
      ...(as ? { as } : {}),
      callbackUrl: pathname,
    });
  }

  // Akun disuspend
  if (status === "SUSPENDED") {
    return redirectTo("/suspended");
  }

  // Belum onboarding (role kosong)
  if (!role) {
    if (isOnboardingRoute) return NextResponse.next();
    if (isStudentRoute) return redirectTo("/onboarding/student");
    if (isUmkmRoute) return redirectTo("/onboarding/umkm");
    return redirectTo("/onboarding");
  }

  // Sudah onboarding: tidak boleh masuk /onboarding lagi
  if (isOnboardingRoute) {
    if (role === "STUDENT") return redirectTo("/student");
    if (role === "UMKM") return redirectTo("/umkm");
    if (role === "ADMIN") return redirectTo("/admin");
  }

  // Proteksi role
  if (isStudentRoute && role !== "STUDENT" && role !== "ADMIN") {
    return redirectTo("/umkm");
  }
  if (isUmkmRoute && role !== "UMKM" && role !== "ADMIN") {
    return redirectTo("/student");
  }
  if (isAdminRoute && role !== "ADMIN") {
    return redirectTo(role === "STUDENT" ? "/student" : "/umkm");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/umkm/:path*", "/admin/:path*", "/onboarding/:path*"],
};