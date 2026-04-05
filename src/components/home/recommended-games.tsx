"use client";

/* ============================================================
 * RecommendedGames -- 추천/인기 경기 섹션 (토스 스타일)
 *
 * /api/web/recommended-games API 응답을 기반으로 동적 렌더링한다.
 * API 실패 시 하드코딩 fallback 카드를 보여준다.
 *
 * 토스 스타일 변경:
 * - TossSectionHeader로 "추천 경기" + "전체보기 >" 헤더
 * - TossCard로 둥근 모서리, 가벼운 그림자 카드
 * - 가로 스크롤 캐러셀 유지하되 카드 스타일만 변경
 *
 * API/데이터 패칭 로직은 기존과 100% 동일하게 유지.
 * ============================================================ */

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { formatRelativeDateTime } from "@/lib/utils/format-date";
import { TYPE_BADGE } from "@/app/(web)/games/_constants/game-badges";

// batch API fetcher: 장소명 배열을 한번에 보내고 맵으로 받음
const batchPhotoFetcher = (key: string) => {
  const queries = JSON.parse(key.replace("/api/web/place-photos:", ""));
  return fetch("/api/web/place-photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries }),
  })
    .then((res) => res.json())
    .then((data) => (data.results ?? {}) as Record<string, string | null>);
};

/* API 응답의 각 경기 항목 (apiSuccess가 snake_case로 변환) */
interface RecommendedGame {
  id: string;
  uuid: string | null;
  title: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  city: string | null;
  game_type: string | null;
  spots_left: number | null;
  match_reason: string[];
}

/* API 전체 응답 구조 */
interface RecommendedData {
  user_name: string | null;
  games: RecommendedGame[];
}

interface RecommendedGamesProps {
  fallbackData?: RecommendedData;
}

/* ---- API 실패 시 보여줄 fallback 더미 데이터 ---- */
const FALLBACK_GAMES: RecommendedGame[] = [
  {
    id: "fallback-1", uuid: null,
    title: "토요일 밤 5vs5 풀코트 매치",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "0", spots_left: null, match_reason: [],
  },
  {
    id: "fallback-2", uuid: null,
    title: "서초 일요 조기 농구 5:5",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "0", spots_left: null, match_reason: [],
  },
  {
    id: "fallback-3", uuid: null,
    title: "게스트 매치 - 강남 체육관",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "1", spots_left: null, match_reason: [],
  },
  {
    id: "fallback-4", uuid: null,
    title: "팀 연습 경기",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "2", spots_left: null, match_reason: [],
  },
];

export function RecommendedGames({ fallbackData }: RecommendedGamesProps) {
  // useSWR로 추천 경기 API 호출 (기존 로직 100% 유지)
  const { data, isLoading: loading } = useSWR<RecommendedData>(
    "/api/web/recommended-games",
    null,
    { fallbackData, revalidateOnMount: true }
  );

  /* user_name이 있으면 로그인 → 개인화 제목, 없으면 비로그인 → 일반 제목 */
  const userName = data?.user_name;
  const title = userName
    ? `${userName}님을 위한 추천`
    : "추천 경기";

  /* API 응답이 없거나 games 배열이 비어있으면 fallback 사용 */
  const games = (data?.games && data.games.length > 0) ? data.games : FALLBACK_GAMES;

  // 모든 경기의 장소명을 수집하여 batch API 1번 호출
  const venueQueries = useMemo(() => {
    return games
      .map((g) => g.venue_name ?? g.city ?? "")
      .filter((v) => v.length >= 2);
  }, [games]);

  const { data: photoMap } = useSWR(
    venueQueries.length > 0
      ? `/api/web/place-photos:${JSON.stringify(venueQueries)}`
      : null,
    batchPhotoFetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 }
  );

  if (loading) {
    return (
      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-56 rounded-md shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 토스 스타일 섹션 헤더: 제목 + "전체보기 >" */}
      <TossSectionHeader title={title} actionHref="/games" />

      {/* 가로 스크롤 캐러셀: 토스 카드 스타일 */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            photoUrl={photoMap === undefined ? undefined : (photoMap[game.venue_name ?? game.city ?? ""] ?? null)}
          />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 경기 카드: 토스 스타일 (둥근 모서리, 가벼운 그림자) ---- */
function GameCard({ game, photoUrl }: { game: RecommendedGame; photoUrl?: string | null }) {
  const typeNum = Number(game.game_type ?? "0");
  const badge = TYPE_BADGE[typeNum] ?? TYPE_BADGE[0];
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const location = game.venue_name ?? game.city ?? "";
  const scheduleStr = formatRelativeDateTime(game.scheduled_at);
  const spotsText = game.spots_left !== null ? `${game.spots_left}자리 남음` : null;

  return (
    <Link href={href} className="block shrink-0 w-[240px]">
      {/* 2K 스타일 카드: 약간 각진 모서리, 강렬한 그림자, 네온 호버 효과 */}
      <div
        className="group rounded-md overflow-hidden bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-primary border border-transparent hover:border-[var(--color-primary)] h-full flex flex-col relative"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* OVR/번호 워터마크 효과 (호버 시 살짝 확대) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-5 font-black italic text-8xl transition-all duration-500 pointer-events-none z-0">
          99
        </div>

        {/* 이미지 영역 */}
        <div
          className={`relative h-32 flex items-center justify-center bg-cover bg-center shrink-0 z-10 ${photoUrl === undefined ? "animate-pulse bg-[var(--color-surface)]" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : photoUrl === null ? { background: badge.gradient } : undefined
          }
        >
          {/* 그라디언트 하프 오버레이 (텍스트 가독성 + 드라마틱 연출) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-black/30" />

          {/* 사진 없을 때 아이콘 */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-6xl text-white/30 drop-shadow-md">{badge.icon}</span>
          )}

          {/* 유형 뱃지 (좌상단) - 네온 스타일로 변형 */}
          <span
            className="absolute top-2 left-2 px-2.5 py-1 text-[10px] font-black italic uppercase clip-slant-sm backdrop-blur-md"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>

          {/* 추천 이유 (우상단) */}
          {game.match_reason.length > 0 && (
            <span className="absolute top-2 right-2 clip-slant-reverse bg-white px-2 py-0.5 text-[10px] font-black italic text-[var(--color-primary)] shadow-sm">
              {game.match_reason[0]}
            </span>
          )}
        </div>

        {/* 정보 영역: 밀도를 높이고 폰트 두께 조절 (2K 스탯 패널 느낌) */}
        <div className="p-3.5 flex flex-col grow z-10 bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface)]">
          {/* 제목 */}
          <h4 className="text-base font-extrabold italic text-[var(--color-text-primary)] line-clamp-2 leading-tight tracking-tight mb-2 uppercase group-hover:text-[var(--color-primary)] transition-colors">
            {game.title ?? "GAME"}
          </h4>

          {/* 장소 + 시간 (스탯처럼 위아래로 좁게 배치) */}
          <div className="mt-auto space-y-1.5 border-t border-[var(--color-border-subtle)] pt-2">
            {location && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span className="truncate">{location}</span>
              </p>
            )}
            {scheduleStr && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {scheduleStr}
              </p>
            )}
          </div>

          {/* 잔여석 - 네온 강조 느낌 */}
          {spotsText && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider text-[var(--color-text-muted)]">SPOT</span>
              <span className="text-sm font-black italic text-[var(--color-primary)] animate-pulse">
                {spotsText}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
