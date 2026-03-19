import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TeamCardData {
  id: bigint;
  name: string;
  primaryColor: string | null;
  secondaryColor?: string | null;
  city: string | null;
  district: string | null;
  wins: number | null;
  losses: number | null;
  accepting_members: boolean | null;
  tournaments_count: number | null;
  _count: { teamMembers: number };
}

function resolveAccent(primary: string | null, secondary?: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#E31B23";
  }
  return primary;
}

export function TeamCard({ team }: { team: TeamCardData }) {
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const memberCount = team._count.teamMembers;

  return (
    <Link href={`/teams/${team.id}`}>
      <div className="group flex flex-col gap-3 rounded-[16px] border border-[#E8ECF0] bg-white overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1B3C87]/30">
        {/* 상단 컬러 바 */}
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
            <p className="truncate font-bold text-[#111827] group-hover:text-[#1B3C87] transition-colors">{team.name}</p>
            {location && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#6B7280]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {location}
              </p>
            )}
          </div>

          {/* 전적 + 멤버 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA3AF]">
              {wins + losses > 0
                ? <span><span className="font-bold text-[#111827]">{wins}</span>W <span className="font-bold text-[#6B7280]">{losses}</span>L</span>
                : "전적 없음"}
            </span>
            <span className="flex items-center gap-1 text-[#6B7280]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              {memberCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
