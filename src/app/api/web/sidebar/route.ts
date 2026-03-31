import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/web/sidebar
 * PC 우측 사이드바 데이터 통합 API
 * 4개 위젯(BDR 랭킹, 주목할 팀, 인기 코트, 최근 활동)을 한 번에 반환
 * 5분(300초) ISR 캐시로 DB 부하 최소화
 */

// 5분 캐시 — 사이드바 데이터는 실시간일 필요 없음
export const revalidate = 300;

export async function GET() {
  try {
    // 최근 7일 기준 날짜 — 인기 코트 집계용
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 4개 쿼리를 병렬로 실행 (waterfall 방지)
    const [topUsers, topTeams, popularCourtSessions, recentActivities] =
      await Promise.all([
        // 1. BDR 랭킹 TOP 5 — XP 높은 순으로 유저 5명
        prisma.user.findMany({
          orderBy: { xp: "desc" },
          take: 5,
          select: {
            id: true,
            nickname: true,
            name: true,
            xp: true,
            level: true,
          },
        }),

        // 2. 주목할 팀 TOP 3 — 승수가 가장 많은 활성 팀 3개
        prisma.team.findMany({
          where: { status: "active" },
          orderBy: { wins: "desc" },
          take: 3,
          select: {
            id: true,
            name: true,
            logoUrl: true,
            city: true,
            wins: true,
            losses: true,
            draws: true,
            members_count: true,
          },
        }),

        // 3. 인기 코트 — 최근 7일 체크인 수 기준 TOP 5
        // groupBy로 court_id별 체크인 횟수 집계
        prisma.court_sessions.groupBy({
          by: ["court_id"],
          where: { checked_in_at: { gte: sevenDaysAgo } },
          _count: { court_id: true },
          orderBy: { _count: { court_id: "desc" } },
          take: 5,
        }),

        // 4. 최근 활동 5건 — 가장 최근 체크인 기록
        prisma.court_sessions.findMany({
          orderBy: { checked_in_at: "desc" },
          take: 5,
          select: {
            id: true,
            checked_in_at: true,
            users: {
              select: { id: true, nickname: true, name: true },
            },
            court_infos: {
              select: { id: true, name: true, city: true, district: true },
            },
          },
        }),
      ]);

    // --- 인기 코트: court_id 목록으로 코트 상세 정보 조회 ---
    const courtIds = popularCourtSessions.map((s) => s.court_id);
    // 체크인 횟수 맵 생성 (court_id → count)
    const checkinCountMap = new Map(
      popularCourtSessions.map((s) => [
        s.court_id.toString(),
        s._count.court_id,
      ])
    );

    // 코트 상세 정보 조회 (이름, 지역)
    const courtInfos = courtIds.length
      ? await prisma.court_infos.findMany({
          where: { id: { in: courtIds } },
          select: { id: true, name: true, city: true, district: true },
        })
      : [];

    // --- 응답 데이터 조립 ---

    // BDR 랭킹: BigInt → string 변환 + 표시명 결정
    const rankings = topUsers.map((u, i) => ({
      rank: i + 1,
      id: u.id.toString(),
      nickname: u.nickname || u.name || "익명",
      xp: u.xp,
      level: u.level,
    }));

    // 주목할 팀: 승률 계산 + BigInt 변환
    const teams = topTeams.map((t) => {
      const wins = t.wins ?? 0;
      const losses = t.losses ?? 0;
      const draws = t.draws ?? 0;
      const total = wins + losses + draws;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      return {
        id: t.id.toString(),
        name: t.name,
        logoUrl: t.logoUrl,
        city: t.city,
        wins,
        losses,
        draws,
        winRate,
        membersCount: t.members_count ?? 0,
      };
    });

    // 인기 코트: 체크인 횟수 포함하여 정렬된 순서 유지
    const courts = courtIds.map((cid, i) => {
      const info = courtInfos.find((c) => c.id === cid);
      return {
        rank: i + 1,
        id: cid.toString(),
        name: info?.name ?? "알 수 없는 코트",
        city: info?.city ?? "",
        district: info?.district ?? "",
        checkinCount: checkinCountMap.get(cid.toString()) ?? 0,
      };
    });

    // 최근 활동: 체크인 기록을 읽기 쉬운 형태로 변환
    const activities = recentActivities.map((a) => ({
      id: a.id.toString(),
      userId: a.users.id.toString(),
      nickname: a.users.nickname || a.users.name || "익명",
      courtId: a.court_infos.id.toString(),
      courtName: a.court_infos.name,
      checkedInAt: a.checked_in_at.toISOString(),
    }));

    return NextResponse.json({
      rankings,
      teams,
      courts,
      activities,
    });
  } catch (error) {
    console.error("[sidebar API] error:", error);
    // 사이드바는 보조 콘텐츠이므로 에러 시 빈 데이터 반환
    return NextResponse.json({
      rankings: [],
      teams: [],
      courts: [],
      activities: [],
    });
  }
}
