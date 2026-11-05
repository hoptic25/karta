import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect student, umkm, admin, and onboarding routes
  const isStudentRoute = pathname.startsWith("/student");
  const isUmkmRoute = pathname.startsWith("/umkm");
  const isAdminRoute = pathname.startsWith("/admin");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!isStudentRoute && !isUmkmRoute && !isAdminRoute && !isOnboardingRoute) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Not logged in
  if (!token) {
    let asParam = "";
    if (isStudentRoute) asParam = "?as=student";
    else if (isUmkmRoute) asParam = "?as=umkm";
    const loginUrl = new URL(`/login${asParam}`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | null;
  const status = token.status as string | null;

  // Suspended user
  if (status === "SUSPENDED" && pathname !== "/suspended") {
    return NextResponse.redirect(new URL("/suspended", request.url));
  }

  // Not onboarded yet (no role)
  if (!role) {
    if (!isOnboardingRoute) {
      if (isStudentRoute) {
        return NextResponse.redirect(new URL("/onboarding/student", request.url));
      }
      if (isUmkmRoute) {
        return NextResponse.redirect(new URL("/onboarding/umkm", request.url));
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  // If already onboarded, don't allow entering /onboarding
  if (isOnboardingRoute && role) {
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (role === "UMKM") {
      return NextResponse.redirect(new URL("/umkm", request.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Role mismatch protection
  if (isStudentRoute && role !== "STUDENT" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/umkm", request.url));
  }
  if (isUmkmRoute && role !== "UMKM" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/student", request.url));
  }
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/umkm/:path*", "/admin/:path*", "/onboarding/:path*"],
};

