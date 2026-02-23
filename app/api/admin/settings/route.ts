import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminSettingsSchema } from "@/lib/validations";

export async function GET() {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const settings = await prisma.adminSettings.findFirst({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const body = await req.json();
  const parsed = adminSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.adminSettings.findFirst({ orderBy: { updatedAt: "desc" } });

  const settings = existing
    ? await prisma.adminSettings.update({
        where: { id: existing.id },
        data: parsed.data
      })
    : await prisma.adminSettings.create({
        data: parsed.data
      });

  return NextResponse.json(settings);
}
