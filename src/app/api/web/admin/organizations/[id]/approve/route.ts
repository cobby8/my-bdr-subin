/**
 * POST /api/web/admin/organizations/[id]/approve — 단체 승인
 *
 * pending → approved로 상태 변경
 * approved_at, approved_by 기록
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { canManageOrganizations } from "@/lib/auth/org-permission";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 관리자 인증
  const session = await getWebSession();
  if (!session || !canManageOrganizations(session)) {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const orgId = BigInt(id);
  const adminId = BigInt(session.sub);

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

  // 승인 처리: status → approved, 승인 시각/관리자 기록
  await prisma.organizations.update({
    where: { id: orgId },
    data: {
      status: "approved",
      approved_at: new Date(),
      approved_by: adminId,
    },
  });

  return apiSuccess({ success: true, name: org.name, status: "approved" });
}
