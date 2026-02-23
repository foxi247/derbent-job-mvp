import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { tariffCreateSchema } from "@/lib/validations";

export async function GET() {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const tariffs = await prisma.tariffPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return NextResponse.json(tariffs);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const body = await req.json();
  const parsed = tariffCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tariff = await prisma.tariffPlan.create({
    data: parsed.data
  });

  return NextResponse.json(tariff, { status: 201 });
}
