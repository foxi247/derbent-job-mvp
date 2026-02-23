import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { favoriteMutationSchema, favoriteQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = favoriteQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      ...(parsed.data.targetType ? { targetType: parsed.data.targetType } : {})
    },
    include: {
      listing: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
              profile: true
            }
          },
          tariffs: {
            where: { status: "ACTIVE", endsAt: { gt: new Date() } },
            include: { tariffPlan: { select: { kind: true } } },
            orderBy: { endsAt: "desc" },
            take: 1
          }
        }
      },
      jobPost: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
              profile: {
                select: { phone: true }
              }
            }
          },
          tariffs: {
            where: { status: "ACTIVE", endsAt: { gt: new Date() } },
            include: { tariffPlan: { select: { kind: true } } },
            orderBy: { endsAt: "desc" },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = favoriteMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId },
      select: { id: true }
    });
    if (!listing) {
      return NextResponse.json({ error: "Анкета не найдена" }, { status: 404 });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: parsed.data.listingId
        }
      },
      update: {},
      create: {
        userId: session.user.id,
        targetType: "LISTING",
        listingId: parsed.data.listingId
      }
    });

    return NextResponse.json(favorite, { status: 201 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: parsed.data.jobPostId as string },
    select: { id: true }
  });
  if (!job) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_jobPostId: {
        userId: session.user.id,
        jobPostId: parsed.data.jobPostId as string
      }
    },
    update: {},
    create: {
      userId: session.user.id,
      targetType: "JOB",
      jobPostId: parsed.data.jobPostId as string
    }
  });

  return NextResponse.json(favorite, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = favoriteMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.listingId) {
    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        listingId: parsed.data.listingId
      }
    });

    return NextResponse.json({ ok: true });
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      jobPostId: parsed.data.jobPostId as string
    }
  });

  return NextResponse.json({ ok: true });
}
