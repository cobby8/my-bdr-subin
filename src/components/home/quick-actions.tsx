"use client";

/* ============================================================
 * QuickActions — 홈 히어로 빠른 액션 버튼 3개
 *
 * 체크인 / 경기 찾기 / 픽업게임 — 가로 3등분 배치
 * 각각 다른 배경색으로 시각적 구분, Link로 페이지 이동
 * ============================================================ */

import Link from "next/link";

// 액션 버튼 정의
const ACTIONS = [
  {
    label: "체크인",
    icon: "location_on",
    href: "/courts",
    bgColor: "var(--color-primary)", // BDR Red
  },
  {
    label: "경기 찾기",
    icon: "sports_basketball",
    href: "/games",
    bgColor: "var(--color-info)", // Blue
  },
  {
    label: "픽업게임",
    icon: "bolt",
    href: "/courts?tab=pickup",
    bgColor: "var(--color-navy, #1B3C87)", // Navy
  },
] as const;

export function QuickActions() {
  return (
    <div className="flex gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: action.bgColor }}
        >
          {/* Material Symbols 아이콘 (32px) */}
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px" }}
          >
            {action.icon}
          </span>
          {/* 버튼 라벨 */}
          <span className="text-sm font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
