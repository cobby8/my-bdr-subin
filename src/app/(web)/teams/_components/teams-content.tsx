"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// API에서 내려오는 팀 데이터 타입 (apiSuccess가 snake_case로 자동 변환)
interface TeamFromApi {
  id: string;                       // BigInt -> string으로 변환됨
  name: string;
  primary_color: string | null;     // camelCase -> snake_case 변환
  secondary_color: string | null;
  city: string | null;
  district: string | null;
  wins: number | null;
  losses: number | null;
  accepting_members: boolean | null;
  tournaments_count: number | null;
  member_count: number;             // _count.teamMembers를 평탄화한 값
}

interface TeamsApiResponse {
  teams: TeamFromApi[];
  cities: string[];
}

// -- 스켈레톤 UI: CSS 변수 적용 --
function TeamsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <div className="h-1" style={{ backgroundColor: 'var(--color-surface)' }} />
          <div className="px-4 pb-4 pt-3 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-11 w-11 rounded-[12px]" />
              <Skeleton className="h-5 w-12 rounded" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 팀 액센트 색상 결정 (흰색이면 보조 색상 사용) --
function resolveAccent(primary: string | null, secondary?: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#E31B23";
  }
  return primary;
}

// -- 팀 카드: CSS 변수 적용 --
function TeamCardFromApi({ team }: { team: TeamFromApi }) {
  const accent = resolveAccent(team.primary_color, team.secondary_color);
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const location = [team.city, team.district].filter(Boolean).join(" ");

  return (
    <Link href={`/teams/${team.id}`}>
      {/* 카드 외형: 테두리/배경 CSS 변수, WHOOP 스타일 호버 */}
      <div className="group flex flex-col gap-3 rounded-[16px] border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        {/* 상단 컬러 바: 팀 고유색 유지 */}
        <div className="h-1" style={{ backgroundColor: accent }} />

        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* 팀 로고 + 모집 뱃지 */}
          <div className="flex items-start justify-between">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] text-base font-black text-white"
              style={{ backgroundColor: accent }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>
            {team.accepting_members && (
              <Badge variant="success">모집중</Badge>
            )}
          </div>

          {/* 팀명 + 지역 */}
          <div className="min-w-0">
            <p className="truncate font-bold transition-colors" style={{ color: 'var(--color-text-primary)' }}>{team.name}</p>
            {location && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {location}
              </p>
            )}
          </div>

          {/* 전적 + 멤버 수 */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--color-text-muted)' }}>
              {wins + losses > 0
                ? <span><span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{wins}</span>W <span className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>{losses}</span>L</span>
                : "전적 없음"}
            </span>
            <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              {team.member_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * TeamsContent - 팀 목록 클라이언트 컴포넌트
 */
export function TeamsContent({
  TeamsFilterComponent,
}: {
  TeamsFilterComponent: React.ComponentType<{ cities: string[] }>;
}) {
  const searchParams = useSearchParams();

  const [teams, setTeams] = useState<TeamFromApi[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // searchParams가 바뀔 때마다 API 호출
  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    const url = `/api/web/teams?${params.toString()}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<TeamsApiResponse>;
      })
      .then((data) => {
        if (data) {
          setTeams(data.teams ?? []);
          setCities(data.cities ?? []);
        }
      })
      .catch(() => {
        setTeams([]);
        setCities([]);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  // 필터가 활성화되어 있는지 확인
  const q = searchParams.get("q");
  const city = searchParams.get("city");
  const hasFilters = q || (city && city !== "all");

  return (
    <>
      {/* 헤더 영역 */}
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          TEAMS
        </h1>
        {/* 팀 만들기 버튼: primary 색상 */}
        <Link
          href="/teams/new"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          팀 만들기
        </Link>
      </div>

      {/* 필터 (도시 목록은 API 응답에서 가져옴) */}
      <TeamsFilterComponent cities={cities} />

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <TeamsGridSkeleton />
      ) : (
        <>
          {/* 필터 활성 시 결과 카운트 */}
          {hasFilters && (
            <p className="mb-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              검색 결과 <span style={{ color: 'var(--color-text-primary)' }}>{teams.length}개</span>
            </p>
          )}

          {/* 팀 카드 그리드 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {teams.map((team) => (
              <TeamCardFromApi key={team.id} team={team} />
            ))}

            {/* 빈 상태 */}
            {teams.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="mb-3 text-4xl">&#127941;</div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {hasFilters ? "조건에 맞는 팀이 없습니다." : "등록된 팀이 없습니다."}
                </p>
              </div>
            )}
          </div>

          {/* 총 팀 수 */}
          {teams.length > 0 && (
            <p className="mt-3 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>총 {teams.length}개 팀</p>
          )}
        </>
      )}
    </>
  );
}
