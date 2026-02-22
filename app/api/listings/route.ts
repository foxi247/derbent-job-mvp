import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getListings } from "@/lib/listings";
import { listingQuerySchema, listingSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listingQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const data = parsed.data;
  const listings = await getListings({
    query: data.query,
    category: data.category,
    online: data.online === "true" ? true : data.online === "false" ? false : undefined,
    urgent: data.urgent === "true" ? true : data.urgent === "false" ? false : undefined,
    experienceMin: data.experienceMin,
    experienceMax: data.experienceMax,
    priceType: data.priceType
  });

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EXECUTOR") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = listingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      priceType: parsed.data.priceType,
      priceValue: parsed.data.priceValue,
      district: parsed.data.district,
      status: parsed.data.status,
      city: "DERBENT"
    }
  });

  return NextResponse.json(listing, { status: 201 });
}