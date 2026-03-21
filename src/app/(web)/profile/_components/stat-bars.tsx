"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface CareerAverages {
  gamesPlayed: number;
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
}

interface SeasonHighs {
  maxPoints: number;
  maxRebounds: number;
  maxAssists: number;
}

interface StatBarsProps {
  careerAverages: CareerAverages | null;
  seasonHighs: SeasonHighs | null;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      {/* 라벨: muted 색상 */}
      <span className="w-10 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex-1">
        {/* 바 트랙: surface 색상 (다크모드 자동 대응) */}
        <div className="h-5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {/* 수치: 메인 텍스트 색상 */}
      <span className="w-10 text-right text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

export function StatBars({ careerAverages, seasonHighs }: StatBarsProps) {
  if (!careerAverages) {
    return (
      /* 빈 상태 카드: CSS 변수 */
      <div className="rounded-[20px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
        <h2
          className="mb-3 text-base font-bold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}
        >
          내 기록
        </h2>
        <div className="flex flex-col items-center gap-3 py-6">
          <TrendingUp size={32} style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>아직 기록이 없어요</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>대회에 참가하면 스탯이 기록됩니다</p>
          {/* CTA 버튼: 웜 오렌지 accent */}
          <Link
            href="/tournaments"
            className="mt-1 rounded-[10px] px-4 py-2 text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            대회 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(
    seasonHighs?.maxPoints ?? careerAverages.avgPoints,
    seasonHighs?.maxRebounds ?? careerAverages.avgRebounds,
    seasonHighs?.maxAssists ?? careerAverages.avgAssists,
    careerAverages.avgSteals,
    careerAverages.avgBlocks,
    1,
  );

  // 각 스탯의 색상은 의미론적 색상이므로 유지 (득점=빨강, 리바운드=오렌지 등)
  const stats = [
    { label: "득점", value: careerAverages.avgPoints, color: "#E31B23" },
    { label: "리바운드", value: careerAverages.avgRebounds, color: "#F4A261" },
    { label: "어시스트", value: careerAverages.avgAssists, color: "#1B3C87" },
    { label: "스틸", value: careerAverages.avgSteals, color: "#16A34A" },
    { label: "블록", value: careerAverages.avgBlocks, color: "#7C3AED" },
  ];

  return (
    /* 카드 외형: CSS 변수 */
    <div className="rounded-[20px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-1 flex items-center justify-between">
        <h2
          className="text-base font-bold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}
        >
          내 기록
        </h2>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{careerAverages.gamesPlayed}경기 평균</span>
      </div>

      {/* 시즌 하이라이트: 배경색은 각 스탯 고유색의 투명 버전 유지 */}
      {seasonHighs && (seasonHighs.maxPoints > 0 || seasonHighs.maxRebounds > 0) && (
        <div className="mb-4 flex gap-3">
          {seasonHighs.maxPoints > 0 && (
            <div className="rounded-xl bg-[#E31B23]/10 px-3 py-1.5">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>최고 득점</p>
              <p className="text-lg font-black text-[#E31B23]">{seasonHighs.maxPoints}</p>
            </div>
          )}
          {seasonHighs.maxRebounds > 0 && (
            <div className="rounded-xl bg-[#F4A261]/10 px-3 py-1.5">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>최고 리바운드</p>
              <p className="text-lg font-black text-[#F4A261]">{seasonHighs.maxRebounds}</p>
            </div>
          )}
          {seasonHighs.maxAssists > 0 && (
            <div className="rounded-xl bg-[#1B3C87]/20 px-3 py-1.5">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>최고 어시스트</p>
              <p className="text-lg font-black text-[#1B3C87]">{seasonHighs.maxAssists}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {stats.map((s) => (
          <Bar key={s.label} label={s.label} value={s.value} max={maxVal} color={s.color} />
        ))}
      </div>
    </div>
  );
}
