import * as jose from "jose";

// membershipType 매핑 (낮은→높은 순서)
// 0=일반유저, 1=픽업호스트, 2=팀장, 3=대회관리자
// isAdmin=true → super_admin (별도 처리)
const MEMBERSHIP_TO_ROLE: Record<number, string> = {
  0: "free",
  1: "pickup_host",
  2: "team_leader",
  3: "tournament_admin",
};

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

const ALGORITHM = "HS256";
// M-02: 30d → 7d 단축. jti를 생성하지만 현재 블랙리스트 미구현.
// TODO: 토큰 즉시 폐기가 필요하면 Redis 기반 jti 블랙리스트 도입 필요
const EXPIRY = "7d";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  admin_role?: string; // 세분화 관리자 역할: "super_admin" | "org_admin" | "content_admin" 등
  exp?: number;
  iat?: number;
  jti?: string;
}

export async function generateToken(user: {
  id: bigint;
  email: string;
  nickname: string | null;
  membershipType: number;
  isAdmin?: boolean | null;
  admin_role?: string | null; // 세분화 관리자 역할 (DB 필드)
}): Promise<string> {
  // 역할 결정: isAdmin=true → super_admin (기존 호환)
  const role = user.isAdmin
    ? "super_admin"
    : (MEMBERSHIP_TO_ROLE[user.membershipType] ?? "free");

  // admin_role: DB에 저장된 세분화 역할. isAdmin=true면 자동으로 super_admin
  const adminRole = user.isAdmin
    ? "super_admin"
    : (user.admin_role ?? undefined);

  return new jose.SignJWT({
    sub: user.id.toString(),
    email: user.email,
    name: user.nickname ?? "",
    role,
    ...(adminRole && { admin_role: adminRole }), // admin_role이 있을 때만 JWT에 포함
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function refreshToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  return new jose.SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    ...(payload.admin_role && { admin_role: payload.admin_role }), // admin_role 유지
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}
