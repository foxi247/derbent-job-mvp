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

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      city: "DERBENT",
      about: parsed.data.about,
      experienceYears: parsed.data.experienceYears,
      skills: parsed.data.skills,
      availability: parsed.data.availability
    },
    update: {
      about: parsed.data.about,
      experienceYears: parsed.data.experienceYears,
      skills: parsed.data.skills,
      availability: parsed.data.availability
    }
  });

  return NextResponse.json(profile);
}