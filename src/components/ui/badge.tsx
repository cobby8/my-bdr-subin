type BadgeVariant = "default" | "success" | "error" | "warning" | "info";

// 뱃지 variant별 스타일 정의
// Phase 4-2: 하드코딩 색상 -> CSS 변수로 전환
// 배경은 각 색상의 12% 투명도, 텍스트는 해당 색상 그대로
const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  success: "bg-[var(--color-success)]/12 text-[var(--color-success)]",
  error:   "bg-[var(--color-error)]/12 text-[var(--color-error)]",
  warning: "bg-[var(--color-warning)]/12 text-[var(--color-warning)]",
  info:    "bg-[var(--color-info)]/12 text-[var(--color-info)]",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
}
