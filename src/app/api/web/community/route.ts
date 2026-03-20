import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/community
 *
 * 게시글 목록을 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: category(카테고리), q(제목+본문 검색)
 * - BigInt/Date 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q") || undefined;

    // where 조건 구성 (기존 page.tsx에서 이동)
    const where: Record<string, unknown> = {};

    // 카테고리 필터
    if (category) {
      where.category = category;
    }

    // 검색어가 있으면 제목 + 본문에서 검색 (대소문자 무시)
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ];
    }

    // 게시글 목록 조회 (최신순 30개, 작성자 닉네임 포함)
    const posts = await prisma.community_posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 30,
      include: { users: { select: { nickname: true } } },
    }).catch(() => []);

    // BigInt/Date 필드를 직렬화 가능한 형태로 변환
    const serializedPosts = posts.map((p) => ({
      id: p.id.toString(),                                    // BigInt -> string
      publicId: p.public_id,
      title: p.title,
      category: p.category,
      viewCount: p.view_count ?? 0,
      commentsCount: p.comments_count ?? 0,
      createdAt: p.created_at?.toISOString() ?? null,          // Date -> ISO string
      authorNickname: p.users?.nickname ?? "익명",              // 작성자 닉네임 추출
    }));

    return apiSuccess({ posts: serializedPosts });
  } catch (error) {
    console.error("[GET /api/web/community] Error:", error);
    return apiError("게시글 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
