/**
 * 경기 카드에서 공통으로 사용하는 뱃지/라벨 상수
 * games-content.tsx와 game-card-compact.tsx에서 중복 정의되어 있던 것을 통합
 */

// 경기 유형별 뱃지 (픽업/게스트/연습)
export const TYPE_BADGE: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "PICKUP",   color: "#FFFFFF", bg: "#2563EB" },
  1: { label: "GUEST",    color: "#FFFFFF", bg: "#16A34A" },
  2: { label: "PRACTICE", color: "#FFFFFF", bg: "#D97706" },
};

// 경기 상태 라벨 (모집중/확정/완료/취소)
export const STATUS_LABEL: Record<number, { text: string; color: string }> = {
  1: { text: "모집중", color: "#16A34A" },
  2: { text: "확정",   color: "#2563EB" },
  3: { text: "완료",   color: "#6B7280" },
  4: { text: "취소",   color: "#EF4444" },
};

// 실력 수준별 뱃지 (초급~상급)
export const SKILL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  beginner:               { label: "초급",   color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  intermediate:           { label: "중급",   color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  intermediate_advanced:  { label: "중상",   color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  advanced:               { label: "상급",   color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};
