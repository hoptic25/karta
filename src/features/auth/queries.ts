import "server-only";
import { auth } from "@/auth";
import { getUserWithProfile } from "./service";

export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return await getUserWithProfile(session.user.id);
}

