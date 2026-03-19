import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const categoryMap: Record<string, { label: string; variant: "default" | "success" | "info" | "warning" }> = {
  general: { label: "자유", variant: "default" },
  info: { label: "정보", variant: "info" },
  review: { label: "후기", variant: "success" },
  marketplace: { label: "장터", variant: "warning" },
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const where = {
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { body: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const posts = await prisma.community_posts.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 30,
    include: { users: { select: { nickname: true } } },
  }).catch(() => []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>COMMUNITY</h1>
        <Link href="/community/new" className="rounded-[10px] bg-[#111827] px-5 py-2 text-sm font-bold text-white hover:bg-[#1F2937] transition-colors" style={{ fontFamily: "var(--font-heading)" }}>글쓰기</Link>
      </div>

      {/* 검색 */}
      <form method="GET" className="mb-4">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="제목 또는 내용 검색"
            className="flex-1 rounded-full border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#1B3C87]"
          />
          <button
            type="submit"
            className="rounded-full bg-[#1B3C87] px-4 py-2 text-sm font-semibold text-white"
          >
            검색
          </button>
          {q && (
            <Link
              href={category ? `/community?category=${category}` : "/community"}
              className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF]"
            >
              초기화
            </Link>
          )}
        </div>
      </form>

      {/* 카테고리 필터 */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={q ? `/community?q=${encodeURIComponent(q)}` : "/community"}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
            !category ? "bg-[rgba(27,60,135,0.12)] text-[#1B3C87]" : "border border-[#E8ECF0] text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          전체
        </Link>
        {Object.entries(categoryMap).map(([key, val]) => {
          const href = q
            ? `/community?category=${key}&q=${encodeURIComponent(q)}`
            : `/community?category=${key}`;
          return (
            <Link
              key={key}
              href={href}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                category === key
                  ? "bg-[rgba(27,60,135,0.12)] font-medium text-[#1B3C87]"
                  : "border border-[#E8ECF0] text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {val.label}
            </Link>
          );
        })}
      </div>

      {/* 검색 결과 안내 */}
      {q && (
        <p className="mb-3 text-sm text-[#6B7280]">
          <span className="font-medium text-[#111827]">&ldquo;{q}&rdquo;</span> 검색 결과{" "}
          <span className="font-medium text-[#1B3C87]">{posts.length}건</span>
        </p>
      )}

      <div className="space-y-3">
        {posts.map((p) => {
          const cat = categoryMap[p.category ?? ""] ?? { label: p.category ?? "기타", variant: "default" as const };
          return (
            <Link key={p.id.toString()} href={`/community/${p.public_id}`}>
              <Card className="group hover:border-[#1B3C87]/30 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge variant={cat.variant}>{cat.label}</Badge>
                  <h3 className="font-bold text-[#111827] group-hover:text-[#1B3C87] transition-colors">{p.title}</h3>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-[#9CA3AF]">
                  <span className="font-medium text-[#6B7280]">{p.users?.nickname ?? "익명"}</span>
                  <span>{p.created_at.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
                  <span className="flex items-center gap-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {p.view_count ?? 0}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    {p.comments_count ?? 0}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
        {posts.length === 0 && <Card className="text-center text-[#6B7280] py-12">게시글이 없습니다.</Card>}
      </div>
    </div>
  );
}
