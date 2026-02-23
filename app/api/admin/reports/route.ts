import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminReportQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = adminReportQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const reports = await prisma.report.findMany({
    where: {
      ...(parsed.data.status ? { status: parsed.data.status } : {})
    },
    include: {
      reporter: {
        select: { id: true, name: true, email: true }
      },
      targetUser: {
        select: { id: true, name: true, email: true, role: true, isBanned: true }
      },
      listing: {
        select: { id: true, title: true, status: true, userId: true }
      },
      jobPost: {
        select: { id: true, title: true, status: true, userId: true }
      }
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300
  });

  return NextResponse.json(reports);
}
