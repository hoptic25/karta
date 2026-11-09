import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role, UserStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      },
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
