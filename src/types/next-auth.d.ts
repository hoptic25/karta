import type { Role, UserStatus } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role | null;
      status?: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: Role | null;
    status?: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role | null;
    status?: UserStatus;
  }
}
