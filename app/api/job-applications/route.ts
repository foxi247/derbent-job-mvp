import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jobApplicationQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = jobApplicationQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const scope =
    parsed.data.scope ??
    (session.user.role === "EMPLOYER" ? "employer" : session.user.role === "EXECUTOR" ? "executor" : null);

  if (!scope) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  if (scope === "executor") {
    if (session.user.role !== "EXECUTOR") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: {
        executorUserId: session.user.id,
        ...(parsed.data.status ? { status: parsed.data.status } : {})
      },
      include: {
        jobPost: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(applications);
  }

  if (session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.jobApplication.updateMany({
    where: {
      employerUserId: session.user.id,
      status: "SENT"
    },
    data: {
      status: "VIEWED"
    }
  });

  const applications = await prisma.jobApplication.findMany({
    where: {
      employerUserId: session.user.id,
      ...(parsed.data.status ? { status: parsed.data.status } : {})
    },
    include: {
      executor: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              phone: true,
              experienceYears: true,
              workCategory: true
            }
          }
        }
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json(applications);
}
