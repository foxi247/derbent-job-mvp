import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contactRevealSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = contactRevealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId },
      include: {
        user: {
          include: {
            profile: {
              select: { phone: true }
            }
          }
        }
      }
    });

    if (!listing) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 });
    }

    const phone = listing.user.profile?.phone;
    if (!phone) {
      return NextResponse.json({ error: "Телефон не указан" }, { status: 404 });
    }

    await prisma.contactView.create({
      data: {
        viewerUserId: session.user.id,
        targetType: "LISTING_EXECUTOR",
        listingId: listing.id
      }
    });

    return NextResponse.json({ phone });
  }

  const jobPost = await prisma.jobPost.findUnique({
    where: { id: parsed.data.jobPostId! },
    include: {
      user: {
        include: {
          profile: {
            select: { phone: true }
          }
        }
      }
    }
  });

  if (!jobPost) {
    return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
  }

  const phone = jobPost.phone ?? jobPost.user.profile?.phone ?? null;
  if (!phone) {
    return NextResponse.json({ error: "Телефон не указан" }, { status: 404 });
  }

  await prisma.contactView.create({
    data: {
      viewerUserId: session.user.id,
      targetType: "JOB_POST",
      jobPostId: jobPost.id
    }
  });

  return NextResponse.json({ phone });
}
