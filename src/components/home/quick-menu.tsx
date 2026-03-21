"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* 메뉴 항목 정의: 아이콘 색상을 다양하게 설정하여 시각적 구분 */
const MENU_POOL = [
  { id: "find_game",    label: "경기 찾기",  icon: "🏀", href: "/games",              iconBg: "var(--color-accent)" },
  { id: "my_team",      label: "내 팀",      icon: "👥", href: "/teams",              iconBg: "var(--color-primary)" },
  { id: "tournaments",  label: "대회 보기",  icon: "🏆", href: "/tournaments",        iconBg: "var(--color-tertiary)" },
  { id: "pickup",       label: "픽업 신청",  icon: "⚡", href: "/games?type=pickup",  iconBg: "var(--color-text-muted)" },
  { id: "my_schedule",  label: "일정",       icon: "📅", href: "/schedule",           iconBg: "var(--color-success)" },
  { id: "stats",        label: "기록",       icon: "📊", href: "/profile?tab=stats",  iconBg: "var(--color-info)" },
  { id: "community",    label: "게시판",     icon: "💬", href: "/community",          iconBg: "var(--color-warning)" },
  { id: "ranking",      label: "랭킹",       icon: "🥇", href: "/ranking",            iconBg: "var(--color-error)" },
  { id: "venue",        label: "코트",       icon: "📍", href: "/courts",             iconBg: "var(--color-accent)" },
] as const;

type MenuId = (typeof MENU_POOL)[number]["id"];

const DEFAULT_ITEMS: MenuId[] = ["find_game", "my_team", "tournaments", "pickup"];
const MAX_ITEMS = 4;

/* ============================================================
 * QuickMenu — Kinetic Pulse 디자인
 * - bdr_6 참고: grid 2x2 → lg 4열, bg-surface-high 카드
 * - No-Line 규칙: 보더 없이 배경색 차이로 구분
 * - 하단 border-b-2 hover:border-primary 효과
 * - 아이콘 영역: 다양한 색상 배경의 rounded-lg 아이콘
 * ============================================================ */
export function QuickMenu() {
  const [items, setItems] = useState<MenuId[]>(DEFAULT_ITEMS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pending, setPending] = useState<MenuId[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/web/user/quick-menu", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as { menu_items: MenuId[] };
          setItems(data.menu_items ?? DEFAULT_ITEMS);
          setIsLoggedIn(true);
        }
        // 401: 미로그인 -> 기본값 유지
      })
      .catch(() => {});
  }, []);

  const menuItems = MENU_POOL.filter((m) => items.includes(m.id));

  const openEdit = () => {
    setPending([...items]);
    setEditMode(true);
  };

  const toggleItem = (id: MenuId) => {
    setPending((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_ITEMS) return prev; // 최대 4개
      return [...prev, id];
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    // 낙관적 업데이트
    setItems(pending);
    setEditMode(false);
    try {
      await fetch("/api/web/user/quick-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ menu_items: pending }),
      });
    } catch {
      // silent fail -- UI already updated optimistically
    } finally {
      setSaving(false);
    }
  };

  /* 편집 모드: surface-low 배경, No-Line 규칙 */
  if (editMode) {
    return (
      <section className="rounded-2xl bg-surface-low p-5">
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            메뉴 편집 ({pending.length}/{MAX_ITEMS}개 선택)
          </span>
          <button
            onClick={saveEdit}
            disabled={saving || pending.length === 0}
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-accent))" }}
          >
            완료
          </button>
        </div>

        {/* 현재 선택된 메뉴 칩 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {MENU_POOL.filter((m) => pending.includes(m.id)).map((m) => (
            <button
              key={m.id}
              onClick={() => toggleItem(m.id)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              {m.icon} {m.label} ✕
            </button>
          ))}
        </div>

        {/* 전체 후보 목록: surface-high 배경으로 구분 (No-Line) */}
        <div className="rounded-xl bg-surface-high p-4">
          <p className="mb-3 text-xs" style={{ color: "var(--color-text-muted)" }}>추가 가능한 메뉴</p>
          <div className="grid grid-cols-3 gap-2">
            {MENU_POOL.filter((m) => !pending.includes(m.id)).map((m) => (
              <button
                key={m.id}
                onClick={() => toggleItem(m.id)}
                disabled={pending.length >= MAX_ITEMS}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-low py-3 text-xs transition-colors hover:bg-surface-bright disabled:opacity-40"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
   * 기본 표시 모드
   * bdr_6 스타일: grid 2열(모바일) / 4열(lg)
   * 각 카드: bg-surface-high, rounded-xl, p-6
   * 하단 border-b-2 투명 → hover 시 primary 색상
   * ============================================================ */
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          Quick Menu
        </h2>
        {isLoggedIn && (
          <button
            onClick={openEdit}
            className="text-xs font-semibold transition-colors hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            편집
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {menuItems.map((m) => (
          <Link key={m.id} href={m.href}>
            {/* 퀵 메뉴 카드: bdr_6 스타일 — surface-high + 하단 보더 효과 */}
            <div
              className="group flex flex-col items-start rounded-xl p-5 transition-all hover:bg-surface-bright"
              style={{
                backgroundColor: "var(--color-surface-high)",
                borderBottom: "2px solid transparent",
              }}
              /* hover 시 하단 보더를 primary로 변경하는 효과는 CSS-in-JS 한계로
                 onMouseEnter/Leave로 구현하거나, Tailwind 클래스로 처리 */
              onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = "var(--color-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
            >
              {/* 아이콘 영역: 다양한 배경색 + rounded-lg */}
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-transform group-hover:scale-110"
                style={{ backgroundColor: `color-mix(in srgb, ${m.iconBg} 20%, transparent)` }}
              >
                {m.icon}
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                {m.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
