import { QuickMenu } from "@/components/home/quick-menu";
import { HeroSection } from "@/components/home/hero-section";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { RecommendedGames } from "@/components/home/recommended-games";

export const revalidate = 60;

/* ============================================================
 * 홈페이지 — Kinetic Pulse 레이아웃
 * - bdr_6 참고: max-w-7xl mx-auto px-6, space-y-12
 * - 넓은 여백으로 에디토리얼 느낌 강화
 * ============================================================ */
export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero: 로그인 시 개인 맞춤 슬라이드, 비로그인 시 Kinetic Pulse 히어로 */}
      <HeroSection />

      {/* BDR 유튜브 추천 영상 */}
      <RecommendedVideos />

      {/* 퀵 메뉴 — 에디토리얼 카드 그리드 */}
      <QuickMenu />

      {/* 개인화 추천 경기 — 벤토 그리드 */}
      <RecommendedGames />
    </div>
  );
}
