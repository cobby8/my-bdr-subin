import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * POST /api/web/auth/reset-password
 * 토큰을 검증하고 새 비밀번호로 변경한다.
 * - 토큰이 유효하고 만료되지 않았으면 비밀번호를 교체한다.
 * - 사용된 토큰은 즉시 삭제하여 재사용을 방지한다.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token ?? "").trim();
    const password = body.password ?? "";

    if (!token) {
      return apiError("유효하지 않은 재설정 링크입니다.", 400);
    }

    // 비밀번호 최소 길이 검증 (8자 이상)
    if (password.length < 8) {
      return apiError("비밀번호는 8자 이상이어야 합니다.", 400);
    }

    // 토큰으로 유저 조회 + 만료시간 확인
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gte: new Date() }, // 현재 시간 이후여야 유효
      },
      select: { id: true },
    });

    if (!user) {
      return apiError("재설정 링크가 만료되었거나 유효하지 않습니다.", 400);
    }

    // 새 비밀번호 해싱 (bcrypt, salt rounds 12)
    const passwordDigest = await bcrypt.hash(password, 12);

    // 비밀번호 변경 + 토큰 삭제 (원자적 업데이트)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordDigest,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    return apiSuccess({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch {
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}
