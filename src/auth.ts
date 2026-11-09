import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as never),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      const baseToken = await authConfig.callbacks?.jwt?.({ token, user, trigger, session }) ?? token;
      
      // Query DB untuk mendapatkan role dan status terbaru
      const email = baseToken.email?.toLowerCase();
      if (email && (user || trigger === "update" || !baseToken.id)) {
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

