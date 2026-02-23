import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveTariffPrice } from "@/lib/tariffs";

export async function GET(req: NextRequest) {
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";

  const tariffs = await prisma.tariffPlan.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceRub: "asc" }]
  });

  return NextResponse.json(
    tariffs.map((tariff) => ({
      ...tariff,
      effectivePriceRub: getEffectiveTariffPrice(tariff.priceRub, tariff.discountPercent)
    }))
  );
}
