import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role, UserStatus } from "@/generated/prisma/client";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role?: Role }).role ?? null;
        token.status = (user as unknown as { status?: UserStatus }).status ?? "ACTIVE";
      }

      // Allow manually updating session from client/server actions
      if (trigger === "update" && session) {
        const newRole = (session as { role?: Role; user?: { role?: Role } }).role ?? (session as { user?: { role?: Role } }).user?.role;
        const newStatus = (session as { status?: UserStatus; user?: { status?: UserStatus } }).status ?? (session as { user?: { status?: UserStatus } }).user?.status;
        if (newRole !== undefined) token.role = newRole;
        if (newStatus !== undefined) token.status = newStatus;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string);
        session.user.role = token.role ?? null;
        session.user.status = token.status ?? "ACTIVE";
      }
      return session;
    },
  },
};
