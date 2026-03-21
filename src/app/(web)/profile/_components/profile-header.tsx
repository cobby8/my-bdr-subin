import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

interface ProfileHeaderProps {
  nickname: string | null;
  email: string;
  profileImageUrl: string | null;
}

export function ProfileHeader({ nickname, email, profileImageUrl }: ProfileHeaderProps) {
  const displayName = nickname ?? "사용자";
  const initial = displayName.trim()[0]?.toUpperCase() || "U";

  return (
    /* 카드 외형: 하드코딩 -> CSS 변수 (다크모드 자동 대응) */
    <div className="relative rounded-[20px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
      <Link
        href="/profile/edit"
        className="absolute right-4 top-4 rounded-full p-1.5 transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Settings size={18} />
      </Link>
      <div className="flex items-center gap-4">
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt={displayName}
            width={72}
            height={72}
            className="h-[72px] w-[72px] flex-shrink-0 rounded-full object-cover ring-2 ring-[#F4A261]/40"
          />
        ) : (
          <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full bg-[#1B3C87] text-2xl font-bold text-white ring-2 ring-[#1B3C87]/30">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1 pr-6">
          <h1
            className="truncate text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}
          >
            {displayName}
          </h1>
          {/* 이메일: 보조 텍스트 색상 */}
          <p className="truncate text-sm" style={{ color: 'var(--color-text-secondary)' }}>{email}</p>
        </div>
      </div>
    </div>
  );
}
