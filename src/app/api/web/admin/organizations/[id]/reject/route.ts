/**
 * POST /api/web/admin/organizations/[id]/reject — 단체 거절
 *
 * pending → rejected로 상태 변경
 * rejection_reason, rejection_at 기록
 *
 * Body: { reason: string }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { canManageOrganizations } from "@/lib/auth/org-permission";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 관리자 인증
  const session = await getWebSession();
  if (!session || !canManageOrganizations(session)) {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const orgId = BigInt(id);

  // 거절 사유 파싱
  const body = (await req.json()) as Record<string, unknown>;
  const reason = (body.reason as string)?.trim();

  if (!reason) {
    return apiError("거절 사유를 입력해주세요.", 400);
  }

  // 단체 존재 및 상태 확인
  const org = await prisma.organizations.findUnique({
    where: { id: orgId },
    select: { id: true, status: true, name: true },
  });

  if (!org) {
    return apiError("단체를 찾을 수 없습니다.", 404);
  }

  if (org.status !== "pending") {
    return apiError(`이미 ${org.status} 상태인 단체입니다.`, 400);
  }

  // 거절 처리: status → rejected, 사유 + 시각 기록
  await prisma.organizations.update({
    where: { id: orgId },
    data: {
      status: "rejected",
      rejection_reason: reason,
      rejection_at: new Date(),
    },
  });

  return apiSuccess({ success: true, name: org.name, status: "rejected" });
}
