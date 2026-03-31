import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withWebAuth, WEB_SESSION_COOKIE, type WebAuthContext } from "@/lib/auth/web-session";

/**
 * DELETE /api/web/auth/withdraw
 * 회원 탈퇴 (soft delete)
 * - 비밀번호를 확인한 후 status를 'withdrawn'으로 변경한다.
 * - 개인정보를 익명화하고 세션 쿠키를 삭제한다.
 */
export const DELETE = withWebAuth(async (req: NextRequest, ctx: WebAuthContext) => {
  try {
    const body = await req.json();
    const password = body.password ?? "";

    if (!password) {
      return apiError("비밀번호를 입력해주세요.", 400);
    }

    // 현재 유저 조회
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, passwordDigest: true, status: true },
    });

    if (!user || user.status === "withdrawn") {
      return apiError("이미 탈퇴한 계정입니다.", 400);
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.passwordDigest);
    if (!isValid) {
      return apiError("비밀번호가 올바르지 않습니다.", 401);
    }

    // soft delete: 상태를 withdrawn으로 변경 + 개인정보 익명화
    const withdrawnAt = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "withdrawn",
        suspended_at: withdrawnAt,
        // 개인정보 익명화 (GDPR/개인정보보호법 대응)
        name: null,
        nickname: `탈퇴회원_${user.id}`,
        phone: null,
        bio: null,
        profile_image: null,
        profile_image_url: null,
        // OAuth 토큰 삭제
        oauth_token: null,
        // 비밀번호 재설정 토큰 삭제
        reset_token: null,
        reset_token_expires: null,
      },
    });

    // 세션 쿠키 삭제
    const cookieStore = await cookies();
    cookieStore.delete(WEB_SESSION_COOKIE);

    return apiSuccess({ message: "회원 탈퇴가 완료되었습니다." });
  } catch {
    return apiError("서버 오류가 발생했습니다.", 500);
  }
});
