import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getWebSession } from "@/lib/auth/web-session";

// FR-060~063: Admin 레이아웃 (super_admin 전용)
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();
  if (!session) {
    redirect("/login");
  }
  // 권한 부족: 에러 메시지 포함 로그인 페이지로 리다이렉트
  if (session.role !== "super_admin") {
    redirect("/login?error=no_permission");
  }

  // 배경: 프론트 디자인 시스템과 동일한 CSS 변수 사용
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AdminSidebar />
      {/* ml-64: 사이드바 w-64에 맞춤 (기존 ml-[260px]에서 변경) */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
