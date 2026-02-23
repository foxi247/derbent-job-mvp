import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, jsonResponse } from "@/lib/api-response";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST(_: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  await markAllNotificationsRead(session.user.id);
  return jsonResponse({ ok: true }, { noStore: true });
}

