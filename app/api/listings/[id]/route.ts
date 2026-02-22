import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listingPatchSchema } from "@/lib/validations";

export async function GET(_: NextRequest, context: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: context.params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: true
        }
      }
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: context.params.id } });
  if (!listing) {
    return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 });
  }

  if (listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = listingPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id: context.params.id },
    data: {
      ...parsed.data,
      city: "DERBENT"
    }
  });

  return NextResponse.json(updated);
}