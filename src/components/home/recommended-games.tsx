"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedGame {
  id: string;
  uuid: string | null;
  title: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  city: string | null;
  game_type: string | null;
  spots_left: number | null;
  match_reason: string[]; // 배열 기반 매칭 이유 (복수 이유 가능)
}

interface RecommendedData {
  user_name: string | null;
  games: RecommendedGame[];
}

/* 게임 타입별 뱃지 스타일: CSS 변수 사용 */
const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  "0": { label: "PICKUP",   color: "var(--color-tertiary)" },
  "1": { label: "GUEST",    color: "var(--color-success)" },
  "2": { label: "PRACTICE", color: "var(--color-warning)" },
};

/* ============================================================
 * RecommendedGames — Kinetic Pulse 디자인
 * - bdr_6 참고: 벤토 그리드 레이아웃 (3열: 큰 카드 2열 + 작은 카드 1열)
 * - No-Line 규칙: 보더 없이 surface 계층으로 구분
 * - 카드: bg-surface-low, rounded-2xl, hover:bg-surface-high
 * ============================================================ */
export function RecommendedGames() {
  const [data, setData] = useState<RecommendedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web/recommended-games", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl md:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </section>
    );
  }

  const games = data?.games ?? [];
  const userName = data?.user_name;
  const title = userName ? `${userName}님을 위한 추천` : "Recommended for You";

  /* 벤토 그리드용: 첫 2개는 큰 카드, 나머지는 작은 카드 */
  const mainGames = games.slice(0, 2);
  const sideGames = games.slice(2, 4);

  return (
    <section>
      {/* 섹션 헤더: font-heading + "전체보기" 링크 */}
      <div className="mb-6 flex items-end justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        <Link
          href="/games"
          prefetch={true}
          className="text-sm font-semibold transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          전체보기
        </Link>
      </div>

      {games.length === 0 ? (
        /* 빈 상태: surface-low 배경, 센터 텍스트 */
        <div
          className="rounded-2xl py-12 text-center"
          style={{ backgroundColor: "var(--color-surface-low)", color: "var(--color-text-muted)" }}
        >
          추천 경기가 없습니다.
        </div>
      ) : (
        /* 벤토 그리드: 큰 카드(2열) + 사이드 카드(1열) */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 메인 카드 영역 (2열 차지) */}
          <div className="space-y-4 md:col-span-2">
            {mainGames.map((g) => {
              const badge = TYPE_BADGE[g.game_type ?? ""] ?? null;
              const dateStr = g.scheduled_at
                ? new Date(g.scheduled_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" })
                : "";
              return (
                <Link key={g.id} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`} prefetch={true}>
                  {/* 큰 카드: bg-surface-low, rounded-2xl, p-6~8 */}
                  <div className="group rounded-2xl p-6 transition-all hover:bg-surface-high" style={{ backgroundColor: "var(--color-surface-low)" }}>
                    <div className="mb-3 flex items-center gap-2">
                      {badge && (
                        <span
                          className="rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest"
                          style={{ backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      )}
                      {g.spots_left !== null && g.spots_left > 0 && (
                        <span
                          className="rounded-lg px-2 py-0.5 text-xs font-bold"
                          style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
                        >
                          {g.spots_left}자리 남음
                        </span>
                      )}
                    </div>
                    <h3
                      className="mb-2 text-lg font-bold line-clamp-1"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
                    >
                      {g.title}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {dateStr}
                      {dateStr && (g.venue_name ?? g.city) ? " · " : ""}
                      {g.venue_name ?? g.city ?? "장소 미정"}
                    </p>
                    {/* 매칭 이유: primary(Red) 텍스트 */}
                    {g.match_reason.length > 0 && (
                      <p className="mt-3 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                        {g.match_reason.join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 사이드 카드 영역 (1열): gradient 배경 or surface-high */}
          <div className="space-y-4">
            {sideGames.length > 0 ? (
              sideGames.map((g) => {
                const badge = TYPE_BADGE[g.game_type ?? ""] ?? null;
                const dateStr = g.scheduled_at
                  ? new Date(g.scheduled_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
                  : "";
                return (
                  <Link key={g.id} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`} prefetch={true}>
                    {/* 사이드 카드: gradient 배경 (accent→Navy 계열) */}
                    <div
                      className="group flex h-full flex-col justify-between rounded-2xl p-6 transition-all hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-secondary))" }}
                    >
                      {badge && (
                        <span className="mb-3 inline-block rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          {badge.label}
                        </span>
                      )}
                      <div>
                        <h3 className="mb-1 text-base font-bold text-white line-clamp-2" style={{ fontFamily: "var(--font-heading)" }}>
                          {g.title}
                        </h3>
                        <p className="text-xs text-white/70">
                          {dateStr} · {g.venue_name ?? g.city ?? "장소 미정"}
                        </p>
                        {g.spots_left !== null && g.spots_left > 0 && (
                          <p className="mt-2 text-xs font-bold text-white/90">
                            {g.spots_left}자리 남음
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              /* 사이드 영역 빈 상태: gradient 배경 + 대회 둘러보기 CTA */
              <Link href="/tournaments">
                <div
                  className="flex flex-col justify-between rounded-2xl p-6"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-secondary))" }}
                >
                  <span className="mb-3 inline-block rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white">
                    대회
                  </span>
                  <h3 className="mb-4 text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    대회에 참가해서<br />실력을 겨뤄보세요
                  </h3>
                  <button className="w-full rounded-lg bg-white py-3 text-xs font-black uppercase tracking-tighter transition-transform active:scale-95" style={{ color: "var(--color-accent)" }}>
                    둘러보기
                  </button>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
