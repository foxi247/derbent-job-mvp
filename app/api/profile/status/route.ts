import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { statusSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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

  return NextResponse.json(profile);
}
