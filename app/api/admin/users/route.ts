import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminUserQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminSession();
  if (authResult.error) {
    return authResult.error;
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = adminUserQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const query = parsed.data;

  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isBanned === "true" ? { isBanned: true } : {}),
    ...(query.isBanned === "false" ? { isBanned: false } : {}),
    ...(query.query
      ? {
          OR: [
            { name: { contains: query.query, mode: "insensitive" } },
            { email: { contains: query.query, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      balanceRub: true,
      isBanned: true,
      bannedAt: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
          jobPosts: true,
          topUpRequests: true
        }
      }
    },
    take: 200
  });

  return NextResponse.json(users);
}
