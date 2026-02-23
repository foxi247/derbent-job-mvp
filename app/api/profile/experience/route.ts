import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const experienceSchema = z.object({
  experienceYears: z.number().int().min(0).max(60)
});

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = experienceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      city: "DERBENT",
      about: "",
      availability: "По договоренности",
      skills: [],
      experienceYears: parsed.data.experienceYears
    },
    update: {
      experienceYears: parsed.data.experienceYears
    }
  });

  return NextResponse.json(profile);
}
