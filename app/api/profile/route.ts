import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (session.user.role === "EXECUTOR") {
    if (!parsed.data.phone?.trim()) {
      return NextResponse.json({ error: "Телефон обязателен для исполнителя" }, { status: 400 });
    }

    if (!parsed.data.workCategory?.trim()) {
      return NextResponse.json({ error: "Укажите категорию, по которой ищете работу" }, { status: 400 });
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

  return NextResponse.json(profile);
}
