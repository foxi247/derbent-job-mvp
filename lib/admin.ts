import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    return { error: apiError("Не авторизован", 401, { code: "UNAUTHORIZED" }) };
  }

  if (session.user.role !== "ADMIN") {
    return { error: apiError("Доступ только для администратора", 403, { code: "FORBIDDEN" }) };
  }

  return { session };
}

