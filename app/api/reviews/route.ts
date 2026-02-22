import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const jobPost = await prisma.jobPost.findUnique({
    where: { id: parsed.data.jobPostId },
    select: { id: true, userId: true, status: true }
  });

  if (!jobPost) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  if (jobPost.userId !== session.user.id) {
    return NextResponse.json({ error: "Можно оставлять отзыв только по своим заданиям" }, { status: 403 });
  }

  if (jobPost.status !== "COMPLETED") {
    return NextResponse.json({ error: "Сначала завершите задание" }, { status: 400 });
  }

  const executor = await prisma.user.findUnique({
    where: { id: parsed.data.executorUserId },
    select: { id: true, role: true }
  });

  if (!executor || executor.role !== "EXECUTOR") {
    return NextResponse.json({ error: "Исполнитель не найден" }, { status: 404 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        jobPostId: parsed.data.jobPostId,
        employerUserId: session.user.id,
        executorUserId: parsed.data.executorUserId,
        rating: parsed.data.rating,
        text: parsed.data.text ?? null
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Отзыв по этому исполнителю и заданию уже оставлен" }, { status: 409 });
    }

    throw error;
  }
}
