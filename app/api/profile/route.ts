import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (session.user.role === "EXECUTOR") {
    if (!parsed.data.phone?.trim()) {
      return apiError("Телефон обязателен для исполнителя", 400, { code: "PHONE_REQUIRED" });
    }

    if (!parsed.data.workCategory?.trim()) {
      return apiError("Укажите категорию, по которой ищете работу", 400, { code: "CATEGORY_REQUIRED" });
    }
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      city: "DERBENT",
      about: parsed.data.about,
      gender: parsed.data.gender ?? null,
      age: parsed.data.age ?? null,
      workCategory: parsed.data.workCategory ?? null,
      previousWork: parsed.data.previousWork ?? null,
      experienceYears: parsed.data.experienceYears,
      skills: parsed.data.skills,
      availability: parsed.data.availability,
      phone: parsed.data.phone ?? null
    },
    update: {
      about: parsed.data.about,
      gender: parsed.data.gender ?? null,
      age: parsed.data.age ?? null,
      workCategory: parsed.data.workCategory ?? null,
      previousWork: parsed.data.previousWork ?? null,
      experienceYears: parsed.data.experienceYears,
      skills: parsed.data.skills,
      availability: parsed.data.availability,
      phone: parsed.data.phone ?? null
    }
  });

  return jsonResponse(profile, { noStore: true });
}

