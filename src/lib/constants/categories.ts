// 종별 (Division) — 콘텐츠 1차 카테고리
export const DIVISIONS = [
  "youth",        // 유소년
  "sports_club",  // 스포츠클럽
  "university",   // 대학부
  "general",      // 일반부
  "senior",       // 시니어
] as const;
export type Division = (typeof DIVISIONS)[number];

export const DIVISION_LABEL: Record<Division, string> = {
  youth: "유소년",
  sports_club: "스포츠클럽",
  university: "대학부",
  general: "일반부",
  senior: "시니어",
};

// 성별 (Gender) — 콘텐츠 2차 카테고리
export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABEL: Record<Gender, string> = {
  male: "남성",
  female: "여성",
};

// 지역 (17개 시도)
export const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;
export type Region = (typeof REGIONS)[number];
