import { NextRequest } from "next/server";
import { listGames, listGameCities } from "@/lib/services/game";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/games
 *
 * 경기 목록 + 도시 목록을 한번에 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: q(검색), type(경기유형), city(도시), date(날짜범위)
 * - BigInt/Date/Decimal 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const q = searchParams.get("q") || undefined;
    const type = searchParams.get("type") || undefined;
    const city = searchParams.get("city") || undefined;
    const date = searchParams.get("date") || undefined;

    // 날짜 범위 계산 (기존 page.tsx에서 이동)
    let scheduledAt: { gte?: Date; lt?: Date } | undefined;
    if (date && date !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (date === "today") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        scheduledAt = { gte: today, lt: tomorrow };
      } else if (date === "week") {
        // 이번 주 월요일 ~ 다음 주 월요일
        const mon = new Date(today);
        mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const nextMon = new Date(mon);
        nextMon.setDate(mon.getDate() + 7);
        scheduledAt = { gte: mon, lt: nextMon };
      } else if (date === "month") {
        scheduledAt = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
      }
    }

    // 서비스 함수로 DB 조회 (병렬 실행으로 성능 최적화)
    const [games, cities] = await Promise.all([
      listGames({ q, type, city, scheduledAt, take: 60 }).catch(() => []),
      listGameCities(30).catch(() => []),
    ]);

    // BigInt, Date, Decimal 필드를 JSON 직렬화 가능하도록 변환
    const serializedGames = games.map((g) => ({
      id: g.id.toString(),                                    // BigInt -> string
      uuid: g.uuid,
      title: g.title,
      status: g.status,
      gameType: g.game_type,
      city: g.city,
      venueName: g.venue_name,
      scheduledAt: g.scheduled_at?.toISOString() ?? null,      // Date -> ISO string
      currentParticipants: g.current_participants,
      maxParticipants: g.max_participants,
      feePerPerson: g.fee_per_person?.toString() ?? null,      // Decimal -> string
      skillLevel: g.skill_level,
    }));

    return apiSuccess({ games: serializedGames, cities });
  } catch (error) {
    console.error("[GET /api/web/games] Error:", error);
    return apiError("경기 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
