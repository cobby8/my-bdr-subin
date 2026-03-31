"use client";

/* ============================================================
 * HomeHero — 홈 히어로 영역 (로그인 분기)
 *
 * 로그인 여부에 따라 다른 상단 UI를 표시:
 * - 로그인: ProfileWidget + QuickActions + NewsFeed
 * - 비로그인: 소개 히어로 + QuickActions + NewsFeed
 *
 * page.tsx가 ISR 서버 컴포넌트이므로, 클라이언트에서
 * /api/web/me를 호출하여 로그인 상태를 판별한다.
 *
 * PC (md 이상)에서는 ProfileWidget + NewsFeed를 2열 그리드로 배치.
 * ============================================================ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProfileWidget } from "./profile-widget";
import { QuickActions } from "./quick-actions";
import { NewsFeed } from "./news-feed";

export function HomeHero() {
  // undefined: 로딩 중, null: 비로그인, object: 로그인
  const [user, setUser] = useState<{ name: string } | null | undefined>(
    undefined
  );

  // 마운트 시 로그인 상태 확인
  useEffect(() => {
    fetch("/api/web/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // 로딩 중: 높이 예약으로 레이아웃 시프트 방지
  if (user === undefined) {
    return <div className="h-48" />;
  }

  // 로그인 상태
  if (user) {
    return (
      <div className="space-y-4">
        {/* PC: 프로필 위젯 + 소식을 2열로, 모바일: 세로 스택 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 왼쪽: 프로필 위젯 + 퀵 액션 (세로 스택) */}
          <div className="space-y-4">
            <ProfileWidget />
            <QuickActions />
          </div>
          {/* 오른쪽: 소식 피드 (PC에서 옆에 배치) */}
          <div className="md:flex md:flex-col">
            <NewsFeed />
          </div>
        </div>
      </div>
    );
  }

  // 비로그인 상태: 소개 히어로 + 퀵 액션 + 소식
  return (
    <div className="space-y-4">
      {/* 소개 히어로: 그라디언트 배경 */}
      <div
        className="rounded-xl p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--color-info) 0%, var(--color-accent) 100%)",
        }}
      >
        {/* 큰 제목 */}
        <h1
          className="text-2xl font-extrabold text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          BDR BASKET
        </h1>
        {/* 부제목 */}
        <p className="text-white/85 text-sm leading-relaxed mb-5">
          농구인을 위한 올인원 플랫폼
        </p>
        {/* 시작하기 버튼 */}
        <Link
          href="/signup"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-bold transition-all active:scale-[0.97]"
          style={{
            backgroundColor: "#fff",
            color: "var(--color-info)",
          }}
        >
          시작하기
        </Link>
      </div>

      {/* 퀵 액션 */}
      <QuickActions />

      {/* 소식 피드 */}
      <NewsFeed />
    </div>
  );
}
