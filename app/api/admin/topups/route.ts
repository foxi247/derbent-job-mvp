import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { expireEntities } from "@/lib/lifecycle";
import { adminTopUpQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  await expireEntities();

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = adminTopUpQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const requests = await prisma.topUpRequest.findMany({
    where: {
      ...(parsed.data.status ? { status: parsed.data.status } : {})
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 300
  });

  return NextResponse.json(requests);
}
