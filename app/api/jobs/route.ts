import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getJobPosts } from "@/lib/jobs";
import { createJobPostPromotion } from "@/lib/promotion";
import { jobPostSchema, jobQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = jobQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const jobs = await getJobPosts({
    query: parsed.data.query,
    category: parsed.data.category,
    payType: parsed.data.payType,
    urgent: parsed.data.urgent === "true" ? true : parsed.data.urgent === "false" ? false : undefined
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = jobPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const jobPost = await prisma.jobPost.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      payType: parsed.data.payType,
      payValue: parsed.data.payValue,
      district: parsed.data.district,
      phone: parsed.data.phone,
      urgentToday: parsed.data.urgentToday ?? false,
      status: parsed.data.status,
      city: "DERBENT"
    }
  });

  if (parsed.data.status === "ACTIVE") {
    const promoted = await createJobPostPromotion(jobPost.id);
    return NextResponse.json(promoted, { status: 201 });
  }

  return NextResponse.json(jobPost, { status: 201 });
}
