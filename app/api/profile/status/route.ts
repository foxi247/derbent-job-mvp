import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { statusSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      city: "DERBENT",
      isOnline: parsed.data.isOnline ?? false,
      urgentToday: parsed.data.urgentToday ?? false,
      about: "",
      availability: "По договоренности",
      skills: []
    },
    update: {
      ...(typeof parsed.data.isOnline === "boolean" ? { isOnline: parsed.data.isOnline } : {}),
      ...(typeof parsed.data.urgentToday === "boolean" ? { urgentToday: parsed.data.urgentToday } : {})
    }
  });

  return jsonResponse(profile, { noStore: true });
}

