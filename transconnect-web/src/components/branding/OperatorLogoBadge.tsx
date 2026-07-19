'use client';

import React, { useMemo, useState } from 'react';
import { Bus } from 'lucide-react';

type OperatorLike = {
  companyName?: string | null;
  name?: string | null;
  brandLogoUrl?: string | null;
  logoUrl?: string | null;
  logo?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
};

type BadgeSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const iconClasses: Record<BadgeSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

function firstTruthyLogo(operator?: OperatorLike | null): string {
  if (!operator) return '';

  const candidates = [
    operator.brandLogoUrl,
    operator.logoUrl,
    operator.logo,
    operator.imageUrl,
    operator.avatarUrl,
  ];

  const logo = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return logo?.trim() || '';
}

function operatorDisplayName(operator?: OperatorLike | null, fallback = 'Operator'): string {
  const name = operator?.companyName || operator?.name;
  return (typeof name === 'string' && name.trim().length > 0) ? name.trim() : fallback;
}

export default function OperatorLogoBadge({
  operator,
  size = 'md',
  className = '',
}: {
  operator?: OperatorLike | null;
  size?: BadgeSize;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUrl = useMemo(() => firstTruthyLogo(operator), [operator]);
  const displayName = useMemo(() => operatorDisplayName(operator), [operator]);

  return (
    <div
      className={`rounded-xl bg-[#ecf4ff] text-[#214c86] flex items-center justify-center overflow-hidden border border-[#dbe8fa] ${sizeClasses[size]} ${className}`}
      aria-label={`${displayName} logo`}
      title={displayName}
    >
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={`${displayName} logo`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="flex items-center justify-center gap-1 font-bold">
          <Bus className={iconClasses[size]} />
          <span className="text-xs leading-none">{displayName.charAt(0).toUpperCase()}</span>
        </span>
      )}
    </div>
  );
}
