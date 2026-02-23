import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiError, apiValidationError, jsonResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { jobApplicationQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Не авторизован", 401, { code: "UNAUTHORIZED" });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = jobApplicationQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiValidationError(parsed.error, "Некорректные параметры");
  }

  const scope =
    parsed.data.scope ??
    (session.user.role === "EMPLOYER" ? "employer" : session.user.role === "EXECUTOR" ? "executor" : null);

  if (!scope) {
    return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
  }

  if (scope === "executor") {
    if (session.user.role !== "EXECUTOR") {
      return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
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

    return jsonResponse(applications, { noStore: true });
  }

  if (session.user.role !== "EMPLOYER") {
    return apiError("Нет доступа", 403, { code: "FORBIDDEN" });
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

  return jsonResponse(applications, { noStore: true });
}

