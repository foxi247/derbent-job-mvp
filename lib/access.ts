import { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function assertNotBanned(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBanned: true, role: true, balanceRub: true }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.isBanned) {
    throw new Error("USER_BANNED");
  }

  return user;
}

export function ensureAdminRole(user: { role?: User["role"] } | null | undefined) {
  return user?.role === "ADMIN";
}
