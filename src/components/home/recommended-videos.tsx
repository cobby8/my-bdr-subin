"use client";

import { useState, useEffect, useRef } from "react";
// lucide-react 제거 → Material Symbols Outlined 사용
import { Skeleton } from "@/components/ui/skeleton";

// API 응답에 맞춘 인터페이스
interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  badges: string[];   // ["LIVE", "스타터스", "HOT", "맞춤"] 등
  is_live: boolean;
}

/* 뱃지 유형별 스타일 반환 — Kinetic Pulse 색상 체계
 * cssVar가 있으면 CSS 변수를 style prop으로 적용 */
function getBadgeStyle(badge: string): { bg: string; text: string; icon?: "flame" | "pulse"; cssVar?: string } {
  switch (badge) {
    case "LIVE":
      // 빨간 배경 + 흰 텍스트 + 깜빡이는 점 — primary(Red)
      return { bg: "bg-red-600", text: "text-white", icon: "pulse" };
    case "HOT":
      // Red→Navy 그라디언트
      return { bg: "bg-gradient-to-r from-red-500 to-orange-400", text: "text-white", icon: "flame" };
    case "맞춤":
      // tertiary(밝은 블루) 계열
      return { bg: "", text: "", cssVar: "tertiary" };
    default:
      // 디비전명 (스타터스, 챌린저 등) → primary-light 배경 + primary 텍스트
      return { bg: "", text: "", cssVar: "primary" };
  }
}

/* ============================================================
 * RecommendedVideos — Kinetic Pulse 디자인
 * - 카드: bg-surface-high, rounded-2xl, hover:bg-surface-bright
 * - No-Line 규칙: 보더 없이 surface 계층으로 구분
 * - YouTube 빨간색은 브랜드 색상이므로 그대로 유지
 * ============================================================ */
export function RecommendedVideos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/web/youtube/recommend", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => setVideos(data?.videos ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-[280px] flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section>
      {/* 헤더: YouTube 아이콘(브랜드 빨강) + 섹션 타이틀 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF0000]">
            <span className="material-symbols-outlined text-sm text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            BDR 추천 영상
          </h2>
        </div>
        <a
          href="https://www.youtube.com/@BDRBASKET"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold hover:underline"
          style={{ color: "#FF0000" }}
        >
          채널 보기
        </a>
      </div>

      {/* 영상 카드 가로 스크롤 */}
      <div className="group relative">
        {/* 스크롤 버튼 (데스크탑): surface-high 배경, No-Line */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-lg bg-surface-high p-1.5 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 md:block md:opacity-0"
        >
          <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-text-primary)" }}>chevron_left</span>
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-lg bg-surface-high p-1.5 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 md:block md:opacity-0"
        >
          <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-text-primary)" }}>chevron_right</span>
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {videos.map((v) => (
            <div
              key={v.video_id}
              className="w-[260px] flex-shrink-0 sm:w-[300px]"
            >
              {/* 썸네일 / 플레이어: rounded-2xl (Kinetic Pulse 카드 라운딩) */}
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-high">
                {playingId === v.video_id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${v.video_id}?autoplay=1&rel=0`}
                    title={v.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    onClick={() => setPlayingId(v.video_id)}
                    className="group/thumb relative block h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
                    />
                    {/* 재생 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover/thumb:bg-black/40">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF0000]/90 shadow-lg transition-transform group-hover/thumb:scale-110">
                        <span className="material-symbols-outlined ml-0.5 text-xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      </div>
                    </div>

                    {/* LIVE 인디케이터: 썸네일 좌상단 */}
                    {v.is_live && (
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-red-600 px-2 py-0.5 shadow-md">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        <span className="text-[11px] font-bold text-white">LIVE</span>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* 영상 정보: 텍스트 색상 CSS 변수 */}
              <div className="mt-2.5 px-0.5">
                <h3
                  className="text-sm font-bold line-clamp-2 leading-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {v.title}
                </h3>
                {/* 뱃지 목록 + 날짜 */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {v.badges.map((badge) => {
                    const style = getBadgeStyle(badge);
                    /* CSS 변수 기반 뱃지 vs Tailwind 클래스 기반 뱃지 분기 */
                    if (style.cssVar) {
                      return (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: `var(--color-${style.cssVar}-light)`,
                            color: `var(--color-${style.cssVar})`,
                          }}
                        >
                          {badge}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={badge}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}
                      >
                        {/* LIVE 뱃지: 깜빡이는 점 */}
                        {style.icon === "pulse" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        )}
                        {/* HOT 뱃지: 불꽃 아이콘 */}
                        {style.icon === "flame" && (
                          <span className="material-symbols-outlined text-[10px] text-white">local_fire_department</span>
                        )}
                        {badge}
                      </span>
                    );
                  })}
                  {/* 날짜 텍스트 */}
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {formatDate(v.published_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}
