"use client";

/* ============================================================
 * RecommendedTournaments -- 추천 대회 섹션 (토스 스타일)
 *
 * /api/web/tournaments API에서 접수중 대회를 가져와 가로 스크롤로 표시.
 * RecommendedGames 컴포넌트와 동일한 패턴(useSWR + TossSectionHeader + 가로 스크롤).
 *
 * API/데이터 패칭은 기존 tournaments API를 그대로 사용.
 * ============================================================ */

import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

/* API 응답의 각 대회 항목 (apiSuccess가 snake_case로 변환) */
interface TournamentItem {
  id: number;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  entryFee: string | null;
  city: string | null;
  venueName: string | null;
  maxTeams: number | null;
  divisions: string[];
  teamCount: number;
}

/* API 전체 응답 구조 */
interface TournamentsResponse {
  tournaments: TournamentItem[];
}

/* SWR fetcher */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* 대회 상태 한글 매핑 */
const STATUS_LABEL: Record<string, string> = {
  registration: "접수중",
  in_progress: "진행중",
  completed: "완료",
  draft: "준비중",
};

/* 대회 포맷 한글 매핑 */
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  round_robin: "리그",
  group_stage: "그룹 스테이지",
  double_elimination: "더블 엘리미네이션",
  swiss: "스위스",
};

/* 대회 상태별 그라디언트 색상 */
const STATUS_GRADIENT: Record<string, string> = {
  registration: "linear-gradient(135deg, #1B3C87, #0079B9)",
  in_progress: "linear-gradient(135deg, #E31B23, #FF6B35)",
  completed: "linear-gradient(135deg, #374151, #6B7280)",
  draft: "linear-gradient(135deg, #4B5563, #9CA3AF)",
};

export function RecommendedTournaments() {
  // useSWR로 대회 목록 API 호출
  const { data, isLoading: loading } = useSWR<TournamentsResponse>(
    "/api/web/tournaments",
    fetcher,
    { revalidateOnFocus: false }
  );

  // 접수중 대회를 우선 표시, 없으면 전체에서 최근 4개
  const allTournaments = data?.tournaments ?? [];
  const registrationTournaments = allTournaments.filter(
    (t) => t.status === "registration"
  );
  // 접수중이 있으면 접수중 우선, 없으면 전체에서 4개
  const tournaments =
    registrationTournaments.length > 0
      ? registrationTournaments.slice(0, 4)
      : allTournaments.slice(0, 4);

  // 대회가 아예 없으면 섹션 자체를 숨김
  if (!loading && tournaments.length === 0) {
    return null;
  }

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
      {/* 2K 스타일 헤더: 두껍고 기울어짐 */}
      <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--color-border)]">
        <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter drop-shadow-sm">
          추천 대회
        </h2>
        <Link href="/tournaments" className="text-[10px] font-black italic text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase">
          VIEW ALL &raquo;
        </Link>
      </div>

      {/* 가로 스크롤 캐러셀: 추천경기와 동일한 패턴 */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 대회 카드: 토스 스타일 (둥근 모서리, 가벼운 그림자) ---- */
function TournamentCard({ tournament }: { tournament: TournamentItem }) {
  const href = `/tournaments/${tournament.id}`;
  const statusLabel = STATUS_LABEL[tournament.status ?? ""] ?? tournament.status ?? "";
  const formatLabel = FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? "";
  const gradient = STATUS_GRADIENT[tournament.status ?? ""] ?? STATUS_GRADIENT.draft;

  // 날짜 포맷: "3월 15일" 형태
  const startStr = tournament.startDate
    ? new Date(tournament.startDate).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })
    : null;

  // 참가 현황 텍스트
  const capacityText = tournament.maxTeams
    ? `${tournament.teamCount}/${tournament.maxTeams}팀`
    : `${tournament.teamCount}팀 참가`;

  return (
    <Link href={href} className="block shrink-0 w-[240px]">
      {/* 2K 스타일 카드: 네온 호버 효과, 강렬한 그림자 */}
      <div
        className="group rounded-md overflow-hidden bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-primary border border-transparent hover:border-[var(--color-primary)] h-full flex flex-col relative"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 워터마크 효과 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-5 font-black italic text-8xl transition-all duration-500 pointer-events-none z-0 tracking-tighter">
          CUP
        </div>

        {/* 이미지 영역: 상태별 그라디언트 배경 + 아이콘 */}
        <div
          className="relative h-32 flex items-center justify-center shrink-0 z-10"
          style={{ background: gradient }}
        >
          {/* 그라디언트 하프 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-black/30" />

          {/* 대회 아이콘 */}
          <span className="material-symbols-outlined text-6xl text-white/30 drop-shadow-md">
            emoji_events
          </span>

          {/* 상태 뱃지 (좌상단) - 네온 스타일 */}
          {statusLabel && (
            <span
              className="absolute top-2 left-2 px-2.5 py-1 text-[10px] font-black italic uppercase clip-slant-sm bg-white/90"
              style={{ color: "var(--color-primary)" }}
            >
              {statusLabel}
            </span>
          )}

          {/* 포맷 뱃지 (우상단) */}
          {formatLabel && (
            <span className="absolute top-2 right-2 clip-slant-reverse bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-black italic text-white shadow-sm">
              {formatLabel}
            </span>
          )}
        </div>

        {/* 정보 영역: 밀도를 높이고 폰트 두께 조절 */}
        <div className="p-3.5 flex flex-col grow z-10 bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface)]">
          {/* 대회명 */}
          <h4 className="text-base font-extrabold italic text-[var(--color-text-primary)] line-clamp-2 leading-tight tracking-tight mb-2 uppercase group-hover:text-[var(--color-primary)] transition-colors">
            {tournament.name}
          </h4>

          {/* 장소 + 일정 */}
          <div className="mt-auto space-y-1.5 border-t border-[var(--color-border-subtle)] pt-2">
            {(tournament.venueName || tournament.city) && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span className="truncate">
                  {tournament.venueName ?? tournament.city}
                </span>
              </p>
            )}
            {startStr && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {startStr}
              </p>
            )}
          </div>

          {/* 참가 현황 (네온 스타일) */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-[var(--color-text-muted)]">ENTRY</span>
            <span className="text-sm font-black italic text-[var(--color-primary)]">
              {capacityText}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
