import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";
import { assertNotBanned } from "@/lib/access";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Войдите в аккаунт, чтобы написать сообщение" }, { status: 401 });
  }

  try {
    await assertNotBanned(session.user.id);
  } catch {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.listingId) {
    const exists = await prisma.listing.findUnique({ where: { id: parsed.data.listingId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Карточка исполнителя не найдена" }, { status: 404 });
    }
  }

  if (parsed.data.jobPostId) {
    const exists = await prisma.jobPost.findUnique({ where: { id: parsed.data.jobPostId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }
  }

  const message = await prisma.message.create({
    data: {
      listingId: parsed.data.listingId ?? null,
      jobPostId: parsed.data.jobPostId ?? null,
      senderName: parsed.data.senderName,
      senderContact: parsed.data.senderContact,
      text: parsed.data.text
    }
  });

  return NextResponse.json(message, { status: 201 });
}
