import { type ReactNode } from "react";

// Card: 공통 카드 컴포넌트
// Phase 4-2: 하드코딩 색상 -> CSS 변수로 전환
// 호버 효과: translate-y(떠오르기) -> 배경색 미세 변화 (WHOOP 스타일)
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-subtle)] ${className}`}>
      {children}
    </div>
  );
}

// StatCard: 통계 표시용 카드 (아이콘 + 라벨 + 값)
// CSS 변수로 아이콘 배경색과 텍스트 색상 적용
export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
