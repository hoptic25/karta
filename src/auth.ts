import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as never),
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      const normalizedEmail = user.email.toLowerCase();
      const isAdmin = adminEmails.includes(normalizedEmail);
      const isCampusEmail = normalizedEmail.endsWith(".ac.id");

      // Update admin role and campus email flag
      if (isAdmin) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            role: "ADMIN",
            isCampusEmail,
          },
        });
      } else {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            isCampusEmail,
          },
        });
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      const baseToken = await authConfig.callbacks?.jwt?.({ token, user, trigger, session }) ?? token;
      
      // Only query DB on initial login, explicit session update, or if token.id is missing
      const email = baseToken.email?.toLowerCase();
      if (email && (user || trigger === "update" || !baseToken.id || adminEmails.includes(email))) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, status: true },
        });

        if (dbUser) {
          baseToken.id = dbUser.id;
          baseToken.role = dbUser.role;
          baseToken.status = dbUser.status;
        }
      }
      return baseToken;
    },
  },
});

