/**
 * 기존 데이터 자동분류 스크립트
 *
 * division/target_gender가 null인 대회/경기/팀/게시글을 제목/내용 기반으로 자동 분류합니다.
 * 실행: npx tsx scripts/auto-classify.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 종별 키워드 매핑
const DIVISION_KEYWORDS: { keywords: string[]; division: string }[] = [
  { keywords: ["유소년", "초등", "중등", "U12", "U15", "U18", "어린이", "주니어", "키즈"], division: "youth" },
  { keywords: ["스포츠클럽", "클럽대항"], division: "sports_club" },
  { keywords: ["대학", "CUSF", "대학부", "대학생"], division: "university" },
  { keywords: ["시니어", "40대", "50대", "장년", "마스터즈", "원로"], division: "senior" },
  { keywords: ["일반", "성인", "오픈"], division: "general" },
];

// 성별 키워드 매핑
const GENDER_KEYWORDS: { keywords: string[]; gender: string }[] = [
  { keywords: ["여성", "여자", "우먼", "걸스", "women", "girl"], gender: "female" },
  { keywords: ["남성", "남자", "men", "boy"], gender: "male" },
];

function detectDivision(text: string): string | null {
  const lower = text.toLowerCase();
  for (const { keywords, division } of DIVISION_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return division;
    }
  }
  return null;
}

function detectGender(text: string): string | null {
  const lower = text.toLowerCase();
  for (const { keywords, gender } of GENDER_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return gender;
    }
  }
  return null;
}

async function classifyTournaments() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { divisions: { equals: [] } },
      ],
    },
    select: { id: true, name: true, description: true },
  });

  let classified = 0;
  for (const t of tournaments) {
    const text = `${t.name} ${t.description ?? ""}`;
    const division = detectDivision(text);
    const gender = detectGender(text);

    if (division || gender) {
      await prisma.tournament.update({
        where: { id: t.id },
        data: {
          ...(division && { divisions: [division] }),
          ...(gender && { target_genders: [gender] }),
        },
      });
      classified++;
      console.log(`  [대회] "${t.name}" → 종별: ${division ?? "미분류"}, 성별: ${gender ?? "전체"}`);
    }
  }

  return { total: tournaments.length, classified };
}

async function classifyGames() {
  const games = await prisma.games.findMany({
    where: { division: null },
    select: { id: true, title: true, description: true },
  });

  let classified = 0;
  for (const g of games) {
    const text = `${g.title ?? ""} ${g.description ?? ""}`;
    const division = detectDivision(text);
    const gender = detectGender(text);

    if (division || gender) {
      await prisma.games.update({
        where: { id: g.id },
        data: {
          ...(division && { division }),
          ...(gender && { target_gender: gender }),
        },
      });
      classified++;
      console.log(`  [경기] "${g.title}" → 종별: ${division ?? "미분류"}, 성별: ${gender ?? "전체"}`);
    }
  }

  return { total: games.length, classified };
}

async function classifyTeams() {
  const teams = await prisma.team.findMany({
    where: { division: null },
    select: { id: true, name: true, description: true },
  });

  let classified = 0;
  for (const t of teams) {
    const text = `${t.name} ${t.description ?? ""}`;
    const division = detectDivision(text);
    const gender = detectGender(text);

    if (division || gender) {
      await prisma.team.update({
        where: { id: t.id },
        data: {
          ...(division && { division }),
          ...(gender && { target_gender: gender }),
        },
      });
      classified++;
      console.log(`  [팀] "${t.name}" → 종별: ${division ?? "미분류"}, 성별: ${gender ?? "전체"}`);
    }
  }

  return { total: teams.length, classified };
}

async function classifyPosts() {
  const posts = await prisma.community_posts.findMany({
    where: { division: null },
    select: { id: true, title: true, content: true },
  });

  let classified = 0;
  for (const p of posts) {
    const text = `${p.title} ${p.content ?? ""}`;
    const division = detectDivision(text);
    const gender = detectGender(text);

    if (division || gender) {
      await prisma.community_posts.update({
        where: { id: p.id },
        data: {
          ...(division && { division }),
          ...(gender && { target_gender: gender }),
        },
      });
      classified++;
      console.log(`  [게시글] "${p.title}" → 종별: ${division ?? "미분류"}, 성별: ${gender ?? "전체"}`);
    }
  }

  return { total: posts.length, classified };
}

async function main() {
  console.log("=== 기존 데이터 자동분류 시작 ===\n");

  console.log("[1/4] 대회 분류 중...");
  const t = await classifyTournaments();
  console.log(`  결과: ${t.classified}/${t.total}건 분류 (미분류: ${t.total - t.classified}건)\n`);

  console.log("[2/4] 경기 분류 중...");
  const g = await classifyGames();
  console.log(`  결과: ${g.classified}/${g.total}건 분류 (미분류: ${g.total - g.classified}건)\n`);

  console.log("[3/4] 팀 분류 중...");
  const tm = await classifyTeams();
  console.log(`  결과: ${tm.classified}/${tm.total}건 분류 (미분류: ${tm.total - tm.classified}건)\n`);

  console.log("[4/4] 게시글 분류 중...");
  const p = await classifyPosts();
  console.log(`  결과: ${p.classified}/${p.total}건 분류 (미분류: ${p.total - p.classified}건)\n`);

  const totalItems = t.total + g.total + tm.total + p.total;
  const totalClassified = t.classified + g.classified + tm.classified + p.classified;
  console.log("=== 자동분류 완료 ===");
  console.log(`총 ${totalClassified}/${totalItems}건 분류됨`);
  console.log(`미분류: ${totalItems - totalClassified}건 → 관리자 페이지(/admin/classify)에서 수동 분류 필요`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("자동분류 실패:", e);
  prisma.$disconnect();
  process.exit(1);
});
