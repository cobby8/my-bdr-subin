import { NextRequest } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * 알림 설정 기본값
 * 모든 유형을 true(ON)로 시작한다.
 * DB에 빈 객체({})가 저장되어 있으면 이 기본값을 적용.
 */
const DEFAULT_SETTINGS = {
  game: true,        // 경기 관련 알림
  tournament: true,  // 대회 관련 알림
  team: true,        // 팀 관련 알림
  community: true,   // 커뮤니티(댓글/좋아요) 알림
  push: true,        // 웹 푸시 알림 수신 여부
};

type NotificationSettings = typeof DEFAULT_SETTINGS;

/**
 * GET /api/web/profile/notification-settings
 * 현재 로그인 유저의 알림 설정을 조회한다.
 * DB에 값이 없으면 기본값(전체 ON)을 반환.
 */
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { notification_settings: true },
    });

    if (!user) return apiError("사용자를 찾을 수 없습니다.", 404);

    // DB 값과 기본값을 병합 (새 항목이 추가되어도 기본 ON 유지)
    const saved = (user.notification_settings as Partial<NotificationSettings>) || {};
    const settings: NotificationSettings = { ...DEFAULT_SETTINGS, ...saved };

    return apiSuccess({ settings });
  } catch (error) {
    console.error("[notification-settings GET]", error);
    return apiError("알림 설정 조회 실패", 500);
  }
});

/**
 * PATCH /api/web/profile/notification-settings
 * 알림 설정을 부분 업데이트한다.
 * body 예시: { "game": false, "push": true }
 */
export const PATCH = withWebAuth(async (request: NextRequest, ctx: WebAuthContext) => {
  try {
    const body = await request.json();

    // 허용된 키만 필터링 (악의적 키 주입 방지)
    const allowedKeys = Object.keys(DEFAULT_SETTINGS) as (keyof NotificationSettings)[];
    const updates: Partial<NotificationSettings> = {};
    for (const key of allowedKeys) {
      if (key in body && typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    // 기존 설정과 병합하여 저장
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { notification_settings: true },
    });
    const current = (user?.notification_settings as Partial<NotificationSettings>) || {};
    const merged = { ...DEFAULT_SETTINGS, ...current, ...updates };

    await prisma.user.update({
      where: { id: ctx.userId },
      data: { notification_settings: merged },
    });

    return apiSuccess({ settings: merged });
  } catch (error) {
    console.error("[notification-settings PATCH]", error);
    return apiError("알림 설정 변경 실패", 500);
  }
});
