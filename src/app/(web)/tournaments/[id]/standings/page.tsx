import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export const revalidate = 30;

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 순위표에 필요한 모든 통계 필드 + 팀 색상을 함께 조회
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: { team: { select: { name: true, primaryColor: true } } },
    orderBy: [{ wins: "desc" }, { point_difference: "desc" }, { points_for: "desc" }, { losses: "asc" }],
  });
  if (!teams) return notFound();

  // 승점 계산: 승리 2점, 패배 1점, 무승부 1점, 기권(경기 없음) 0점
  const calcPoints = (wins: number, losses: number, draws: number) =>
    wins * 2 + losses * 1 + draws * 1;

  // 승점 기준으로 재정렬 (DB orderBy는 승점 필드가 없으므로 서버에서 계산)
  const sorted = [...teams].sort((a, b) => {
    const ptsA = calcPoints(a.wins ?? 0, a.losses ?? 0, a.draws ?? 0);
    const ptsB = calcPoints(b.wins ?? 0, b.losses ?? 0, b.draws ?? 0);
    if (ptsB !== ptsA) return ptsB - ptsA;          // 1순위: 승점 높은 순
    if ((b.point_difference ?? 0) !== (a.point_difference ?? 0))
      return (b.point_difference ?? 0) - (a.point_difference ?? 0); // 2순위: 득실차
    return (b.points_for ?? 0) - (a.points_for ?? 0); // 3순위: 득점 많은 순
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">순위표</h1>
      <Card className="overflow-hidden p-0">
        {/* 가로 스크롤: 모바일에서 컬럼이 많아도 잘림 없이 스크롤 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-3 text-center sm:px-5">#</th>
                <th className="px-3 py-3 text-left sm:px-5">팀</th>
                <th className="px-2 py-3 text-center sm:px-4">승</th>
                <th className="px-2 py-3 text-center sm:px-4">패</th>
                <th className="px-2 py-3 text-center sm:px-4">무</th>
                <th className="px-2 py-3 text-center sm:px-4">승률</th>
                <th className="px-2 py-3 text-center sm:px-4">득점</th>
                <th className="px-2 py-3 text-center sm:px-4">실점</th>
                <th className="px-2 py-3 text-center sm:px-4">득실차</th>
                <th className="px-2 py-3 text-center sm:px-4">승점</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => {
                const w = t.wins ?? 0;
                const l = t.losses ?? 0;
                const d = t.draws ?? 0;
                const total = w + l + d;
                const pct = total > 0 ? (w / total).toFixed(3) : ".000";
                const pf = t.points_for ?? 0;
                const pa = t.points_against ?? 0;
                const diff = t.point_difference ?? (pf - pa);
                const pts = calcPoints(w, l, d);
                const teamColor = t.team.primaryColor;

                return (
                  <tr key={t.id.toString()} className="border-b border-[var(--color-border)]">
                    {/* 순위 숫자 */}
                    <td className="px-3 py-3 text-center font-bold text-[var(--color-primary)] sm:px-5">
                      {i + 1}
                    </td>
                    {/* 팀명 + 좌측 색상 인디케이터 */}
                    <td className="px-3 py-3 sm:px-5">
                      <div className="flex items-center gap-2">
                        {/* 팀 고유색상 바: DB의 primaryColor를 동적으로 적용 */}
                        <span
                          className="inline-block h-4 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: teamColor ?? "var(--color-text-muted)" }}
                        />
                        <span className="font-medium">{t.team.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center sm:px-4">{w}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{l}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{d}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{pct}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{pf}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{pa}</td>
                    {/* 득실차: 양수면 초록, 음수면 빨강, 0이면 기본색 */}
                    <td className={`px-2 py-3 text-center font-semibold sm:px-4 ${
                      diff > 0
                        ? "text-[var(--color-success)]"
                        : diff < 0
                          ? "text-[var(--color-error)]"
                          : "text-[var(--color-text-muted)]"
                    }`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    {/* 승점: 가장 중요한 수치이므로 강조 */}
                    <td className="px-2 py-3 text-center font-bold text-[var(--color-primary)] sm:px-4">
                      {pts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
