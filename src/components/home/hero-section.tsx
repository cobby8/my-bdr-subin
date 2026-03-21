"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PersonalHero } from "./personal-hero";

export function HeroSection() {
  const [state, setState] = useState<"loading" | "logged-in" | "guest">("loading");
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // 개발서버에서 Turbopack 컴파일 지연으로 무한 로딩 방지용 타임아웃
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/web/dashboard", { credentials: "include", signal: controller.signal })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setDashboardData(data);
          setState("logged-in");
        } else {
          setState("guest");
        }
      })
      .catch(() => setState("guest"))
      .finally(() => clearTimeout(timeout));
  }, []);

  if (state === "loading") {
    return (
      /* 로딩 스켈레톤: surface 계층 그라디언트로 로딩 표시 */
      <div className="aspect-[21/9] animate-pulse rounded-2xl bg-surface-low" />
    );
  }

  if (state === "logged-in" && dashboardData) {
    return <PersonalHero preloadedData={dashboardData} />;
  }

  /* ============================================================
   * 비로그인 히어로 — Kinetic Pulse 디자인
   * - bdr_6 참고: 대형 배너 + 그라디언트 오버레이
   * - 배경 이미지 대신 그라디언트로 시각적 임팩트
   * - No-Line 규칙: 보더 없이 배경색 차이로 구분
   * ============================================================ */
  return (
    <section className="relative overflow-hidden rounded-2xl bg-surface-low">
      {/* 배경 그라디언트 오버레이: surface → 투명으로 페이드 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(227,27,35,0.12) 0%, rgba(27,60,135,0.08) 100%)",
        }}
      />
      {/* 상단→하단 페이드: 콘텐츠 가독성 확보 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, var(--color-surface) 0%, transparent 60%)",
        }}
      />

      {/* 장식용 농구공 패턴 (우측 하단, 반투명) */}
      <div className="absolute -bottom-10 -right-10 text-[200px] leading-none opacity-[0.04] select-none">
        🏀
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="relative px-8 py-12 md:px-12 md:py-16 lg:py-20">
        {/* LIVE NOW 뱃지: primary 색상으로 스파링하게 사용 */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: "var(--color-primary)", color: "#FFFFFF" }}
          >
            Welcome
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            농구인을 위한 플랫폼
          </span>
        </div>

        {/* 헤드라인: Space Grotesk, tracking-tighter, 대형 타이포 */}
        <h1
          className="mb-4 text-4xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          <span style={{ color: "var(--color-primary)" }}>B</span>asketball{" "}
          <span style={{ color: "var(--color-primary)" }}>D</span>aily{" "}
          <span style={{ color: "var(--color-primary)" }}>R</span>outine
        </h1>

        {/* 서브 카피: 따뜻한 톤의 보조 텍스트 */}
        <p className="mb-8 max-w-lg text-base" style={{ color: "var(--color-text-secondary)" }}>
          농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요
        </p>

        {/* CTA 버튼 2개: 메인(gradient Red→Navy) + 서브(글래스모피즘) */}
        <div className="flex gap-4">
          <Link href="/games" prefetch={true}>
            {/* 메인 CTA: Primary→Accent 그라디언트 */}
            <button
              className="flex items-center gap-2 rounded-lg px-8 py-3 font-bold text-white transition-transform active:scale-95"
              style={{
                background: "linear-gradient(to right, var(--color-primary), var(--color-accent))",
              }}
            >
              경기 찾기
            </button>
          </Link>
          <Link href="/tournaments" prefetch={true}>
            {/* 서브 CTA: 글래스모피즘 스타일 */}
            <button className="rounded-lg bg-white/10 px-8 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
              대회 둘러보기
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
