import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createJobPostPromotion } from "@/lib/promotion";
import { jobPostPatchSchema } from "@/lib/validations";

export async function GET(_: NextRequest, context: { params: { id: string } }) {
  const jobPost = await prisma.jobPost.findUnique({
    where: { id: context.params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              phone: true
            }
          }
        }
      }
    }
  });

  if (!jobPost) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  return NextResponse.json(jobPost);
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const jobPost = await prisma.jobPost.findUnique({ where: { id: context.params.id } });
  if (!jobPost) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  if (jobPost.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = jobPostPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.jobPost.update({
    where: { id: context.params.id },
    data: {
      ...parsed.data,
      city: "DERBENT"
    }
  });

  if (parsed.data.status === "ACTIVE" && jobPost.status !== "ACTIVE") {
    const promoted = await createJobPostPromotion(updated.id);
    return NextResponse.json(promoted);
  }

  return NextResponse.json(updated);
}
