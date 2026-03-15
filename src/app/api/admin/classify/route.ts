import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";
import { DIVISIONS, GENDERS } from "@/lib/constants/categories";

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

/**
 * GET /api/admin/classify?type=tournament|game|team|post
 * 미분류 콘텐츠 목록 조회
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const type = req.nextUrl.searchParams.get("type") ?? "tournament";

  switch (type) {
    case "tournament": {
      const items = await prisma.tournament.findMany({
        where: { OR: [{ divisions: { equals: [] } }] },
        select: { id: true, name: true, description: true, status: true, startDate: true },
        orderBy: { startDate: "desc" },
        take: 200,
      });
      return apiSuccess({
        type: "tournament",
        items: items.map((i) => ({
          id: i.id,
          title: i.name,
          description: i.description?.slice(0, 200) ?? null,
          status: i.status,
          date: i.startDate?.toISOString() ?? null,
        })),
        total: items.length,
      });
    }
    case "game": {
      const items = await prisma.games.findMany({
        where: { division: null },
        select: { id: true, title: true, description: true, status: true, scheduled_at: true },
        orderBy: { scheduled_at: "desc" },
        take: 200,
      });
      return apiSuccess({
        type: "game",
        items: items.map((i) => ({
          id: i.id.toString(),
          title: i.title ?? "제목 없음",
          description: i.description?.slice(0, 200) ?? null,
          status: i.status,
          date: i.scheduled_at?.toISOString() ?? null,
        })),
        total: items.length,
      });
    }
    case "team": {
      const items = await prisma.team.findMany({
        where: { division: null },
        select: { id: true, name: true, description: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return apiSuccess({
        type: "team",
        items: items.map((i) => ({
          id: i.id.toString(),
          title: i.name,
          description: i.description?.slice(0, 200) ?? null,
          status: null,
          date: i.createdAt?.toISOString() ?? null,
        })),
        total: items.length,
      });
    }
    case "post": {
      const items = await prisma.community_posts.findMany({
        where: { division: null },
        select: { id: true, title: true, content: true, created_at: true },
        orderBy: { created_at: "desc" },
        take: 200,
      });
      return apiSuccess({
        type: "post",
        items: items.map((i) => ({
          id: i.id.toString(),
          title: i.title,
          description: i.content?.slice(0, 200) ?? null,
          status: null,
          date: i.created_at?.toISOString() ?? null,
        })),
        total: items.length,
      });
    }
    default:
      return apiError("Invalid type", 400);
  }
}

const classifyItemSchema = z.object({
  type: z.enum(["tournament", "game", "team", "post"]),
  id: z.string(),
  division: z.enum(DIVISIONS).nullable().optional(),
  target_gender: z.enum(GENDERS).nullable().optional(),
});

const classifySchema = z.object({
  items: z.array(classifyItemSchema).min(1).max(100),
});

/**
 * PATCH /api/admin/classify
 * 개별 또는 일괄 분류 업데이트
 */
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const parsed = classifySchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input", 400);

  const { items } = parsed.data;
  let updated = 0;

  for (const item of items) {
    switch (item.type) {
      case "tournament": {
        const data: Record<string, unknown> = {};
        if (item.division !== undefined) {
          data.divisions = item.division ? [item.division] : [];
        }
        if (item.target_gender !== undefined) {
          data.target_genders = item.target_gender ? [item.target_gender] : [];
        }
        if (Object.keys(data).length > 0) {
          await prisma.tournament.update({ where: { id: item.id }, data });
          updated++;
        }
        break;
      }
      case "game": {
        const data: Record<string, unknown> = {};
        if (item.division !== undefined) data.division = item.division;
        if (item.target_gender !== undefined) data.target_gender = item.target_gender;
        if (Object.keys(data).length > 0) {
          await prisma.games.update({ where: { id: BigInt(item.id) }, data });
          updated++;
        }
        break;
      }
      case "team": {
        const data: Record<string, unknown> = {};
        if (item.division !== undefined) data.division = item.division;
        if (item.target_gender !== undefined) data.target_gender = item.target_gender;
        if (Object.keys(data).length > 0) {
          await prisma.team.update({ where: { id: BigInt(item.id) }, data });
          updated++;
        }
        break;
      }
      case "post": {
        const data: Record<string, unknown> = {};
        if (item.division !== undefined) data.division = item.division;
        if (item.target_gender !== undefined) data.target_gender = item.target_gender;
        if (Object.keys(data).length > 0) {
          await prisma.community_posts.update({ where: { id: BigInt(item.id) }, data });
          updated++;
        }
        break;
      }
    }
  }

  return apiSuccess({ updated });
}
