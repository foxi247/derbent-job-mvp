import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Не авторизован" }, { status: 401 }) };
  }

  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Доступ только для администратора" }, { status: 403 }) };
  }

  return { session };
}
