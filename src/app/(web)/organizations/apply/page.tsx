"use client";

/**
 * 단체 신청 페이지
 * 일반 유저가 단체를 신청하면 pending 상태로 생성되고,
 * 관리자가 승인하면 approved로 변경된다.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 상태
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [applyNote, setApplyNote] = useState("");

  // 단체 신청 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("단체 이름은 필수입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/web/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          region: region.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
          apply_note: applyNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "신청 중 오류가 발생했습니다.");
        return;
      }

      // 성공: pending이면 승인 대기 안내, approved면 바로 이동
      if (data.data?.status === "approved") {
        router.push(`/organizations/${data.data.slug}`);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 신청 완료 화면
  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-success)]">
          check_circle
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          신청이 완료되었습니다
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          관리자 검토 후 승인되면 알려드리겠습니다.
          <br />
          보통 1~2일 내에 처리됩니다.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        단체 신청
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        단체를 등록하면 시리즈와 대회를 체계적으로 관리할 수 있습니다.
      </p>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 rounded bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* 단체 이름 (필수) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            단체 이름 <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 서울 농구 연합회"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            required
          />
        </div>

        {/* 소개 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            단체 소개
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="단체의 활동 내용, 목적 등을 간단히 소개해주세요"
            rows={3}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 활동 지역 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            활동 지역
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 서울, 경기"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 연락 이메일 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            연락 이메일
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@example.com"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 웹사이트 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            웹사이트
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 신청 메모 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            신청 메모
          </label>
          <textarea
            value={applyNote}
            onChange={(e) => setApplyNote(e.target.value)}
            placeholder="단체 등록 목적이나 관리자에게 전달하고 싶은 내용"
            rows={2}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "신청 중..." : "단체 신청"}
        </button>
      </form>
    </div>
  );
}
