import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminResolveReportSchema } from "@/lib/validations";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const body = await req.json().catch(() => ({}));
  const parsed = adminResolveReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id: context.params.id },
    include: {
      targetUser: {
        select: { id: true, role: true }
      }
    }
  });

  if (!report) {
    return NextResponse.json({ error: "Жалоба не найдена" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.report.update({
      where: { id: report.id },
      data: { status: parsed.data.status }
    });

    if (parsed.data.banTargetUser && report.targetUserId) {
      const targetUser = report.targetUser;
      if (targetUser && targetUser.role !== "ADMIN") {
        await tx.user.update({
          where: { id: report.targetUserId },
          data: {
            isBanned: true,
            bannedAt: new Date()
          }
        });
      }
    }

    if (parsed.data.pauseTargetPublication) {
      if (report.listingId) {
        await tx.listing.update({
          where: { id: report.listingId },
          data: {
            status: "PAUSED"
          }
        });
      }

      if (report.jobPostId) {
        await tx.jobPost.update({
          where: { id: report.jobPostId },
          data: {
            status: "PAUSED"
          }
        });
      }
    }

    return next;
  });

  return NextResponse.json(updated);
}
