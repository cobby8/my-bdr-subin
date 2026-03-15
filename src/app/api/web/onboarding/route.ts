import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { z } from "zod";
import { DIVISIONS, GENDERS, REGIONS } from "@/lib/constants/categories";

const onboardingSchema = z.object({
  divisions: z.array(z.enum(DIVISIONS)).min(1, "종별을 최소 1개 선택해주세요"),
  genders: z.array(z.enum(GENDERS)).min(1, "성별을 최소 1개 선택해주세요"),
  regions: z.array(z.enum(REGIONS)).min(1, "활동지역을 최소 1개 선택해주세요"),
});

export const POST = withWebAuth(async (req: NextRequest, ctx: WebAuthContext) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = onboardingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { divisions, genders, regions } = result.data;

  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      preferred_divisions: divisions,
      preferred_genders: genders,
      preferred_regions: regions,
      onboarding_completed: true,
    },
  });

  return NextResponse.json({ success: true });
});
