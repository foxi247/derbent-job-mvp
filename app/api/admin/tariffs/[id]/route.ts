import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { tariffPatchSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const body = await req.json();
  const parsed = tariffPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tariff = await prisma.tariffPlan.update({
    where: { id: context.params.id },
    data: parsed.data
  });

  return NextResponse.json(tariff);
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const tariff = await prisma.tariffPlan.update({
    where: { id: context.params.id },
    data: { isActive: false }
  });

  return NextResponse.json(tariff);
}
