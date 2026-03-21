"use client";

import Link from "next/link";

// Rails _full_menu.html.erb 복제
const menuSections = {
  boards: [
    { href: "/community", label: "게시판 전체" },
    { href: "/community?category=general", label: "자유게시판" },
    { href: "/community?category=info", label: "정보게시판" },
    { href: "/community?category=review", label: "후기게시판" },
    { href: "/community?category=marketplace", label: "장터게시판" },
  ],
  etc: [
    { href: "/games/my-games", label: "내 경기", icon: "🏀" },
    { href: "/teams", label: "내 팀", icon: "👕" },
    { href: "/courts", label: "코트 찾기", icon: "📍" },
    // { href: "/pricing", label: "요금제", icon: "💳" },
    { href: "/profile", label: "프로필", icon: "👤" },
    { href: "/tournament-admin", label: "대회 관리", icon: "⚙️", adminOnly: true },
    { href: "/admin", label: "관리자", icon: "🔧", superAdminOnly: true },
  ],
};

export function SlideMenu({
  open,
  onClose,
  isLoggedIn,
  role,
  name,
  email,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  role?: string;
  name?: string;
  email?: string;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          onClick={onClose}
        />
      )}

      {/* Panel -- Kinetic Pulse: surface-low 배경 (#1C1B1B) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        className={`fixed right-0 top-0 z-[70] h-full w-[300px] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: 'var(--color-surface-low)' }}
      >
        {/* Header -- Kinetic Pulse: No-Line 규칙이지만 패널 구분용 ghost border 유지, 타이틀=primary(Red) */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span className="font-bold" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-primary)' }}>메뉴</span>
          <button
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="rounded-full p-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ height: "calc(100% - 57px)" }}>
          {isLoggedIn ? (
            <>
              {/* User Info -- Kinetic Pulse: surface-high 카드, 최소 라운딩 */}
              <Link
                href="/profile"
                onClick={onClose}
                className="mb-6 flex items-center gap-3 p-4 transition-colors active:opacity-80"
                style={{ backgroundColor: 'var(--color-surface-high)', borderRadius: 'var(--radius-card)' }}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                  {name?.trim() ? name.trim()[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" style={{ color: 'var(--color-text-primary)' }}>{name || "사용자"}</p>
                  {email && <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>{email}</p>}
                </div>
                <span className="flex-shrink-0 text-xs" style={{ color: 'var(--color-text-muted)' }}>›</span>
              </Link>

              {/* 게시판 -- Kinetic Pulse: 비활성 메뉴 opacity-70, hover 시 bg-white/5 + opacity-100 */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-muted)' }}>게시판</p>
                {menuSections.boards.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center px-3 py-2.5 text-sm opacity-70 transition-all hover:bg-white/5 hover:opacity-100"
                    style={{ color: 'var(--color-text-primary)', borderRadius: 'var(--radius-card)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* 기타 -- Kinetic Pulse: 동일한 hover 스타일 적용 */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-muted)' }}>기타</p>
                {menuSections.etc
                  .filter((item) => {
                    if (item.superAdminOnly) return role === "super_admin";
                    if (item.adminOnly) return role === "super_admin" || role === "tournament_admin";
                    return true;
                  })
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm opacity-70 transition-all hover:bg-white/5 hover:opacity-100"
                      style={{ color: 'var(--color-text-primary)', borderRadius: 'var(--radius-card)' }}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      {item.label}
                    </Link>
                  ))}
              </div>

              {/* 로그아웃 */}
              <a
                href="/api/auth/logout"
                /* 로그아웃 버튼: 위험 동작이므로 에러 색상 유지, hover 시 반투명 배경 */
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-white/5"
                style={{ color: 'var(--color-error)', borderRadius: 'var(--radius-card)' }}
              >
                로그아웃
              </a>
            </>
          ) : (
            <div className="flex flex-col">
              {/* 브랜드 -- Kinetic Pulse: primary(Electric Red) 포인트, 최소 라운딩 */}
              <div className="mb-6 px-5 py-6 text-center" style={{ backgroundColor: 'var(--color-surface-high)', borderRadius: 'var(--radius-card)' }}>
                <p className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-primary)' }}>BDR</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>농구인을 위한 농구 플랫폼</p>
              </div>

              {/* 기능 소개 -- 텍스트 CSS 변수 */}
              <div className="mb-6 space-y-3">
                {[
                  { icon: "🏀", title: "픽업게임", desc: "내 주변 경기 참가" },
                  { icon: "👕", title: "팀 관리", desc: "팀원 모집 · 매니지먼트" },
                  { icon: "🏆", title: "토너먼트", desc: "대회 참가 · 전적 관리" },
                ].map((f) => (
                  <div key={f.title} className="flex items-center gap-3 px-3 py-2" style={{ borderRadius: 'var(--radius-card)' }}>
                    <span className="text-xl">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{f.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA 버튼 -- Kinetic Pulse: 로그인=primary(Red), 회원가입=ghost border, 최소 라운딩 */}
              <Link
                href="/login"
                onClick={onClose}
                className="mb-2 w-full py-3 text-center text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)' }}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="w-full py-3 text-center text-sm font-bold"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-button)',
                }}
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
