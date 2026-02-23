import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { roleChoiceSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = roleChoiceSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { role: parsed.data.role }
  });

  return jsonResponse({ id: user.id, role: user.role }, { noStore: true });
}

