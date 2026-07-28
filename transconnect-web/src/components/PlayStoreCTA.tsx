'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { PLAY_STORE_URL } from '@/lib/links';
import { trackEvent } from '@/lib/analytics';

type PlayStoreCTAProps = {
  compact?: boolean;
  className?: string;
  source?: string;
  onClick?: () => void;
};

export default function PlayStoreCTA({ compact = false, className, source = 'unknown', onClick }: PlayStoreCTAProps) {
  function handleClick() {
    trackEvent('playstore_cta_click', {
      source,
      compact,
    });

    onClick?.();
  }

  if (compact) {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={[
          'inline-flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl border border-white/20 bg-[#0f0f10] px-3 text-white shadow-[0_2px_8px_rgba(0,0,0,0.32)] hover:bg-[#1a1a1c] transition-colors',
          className ?? ''
        ].join(' ').trim()}
        aria-label="Download TransConnect on Google Play"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-white/10">
          <Play className="h-3 w-3 fill-current" />
        </div>
        <span className="leading-[1.05]">
          <span className="block text-[9px] uppercase tracking-[0.08em] text-white/75">GET IT ON</span>
          <span className="block text-[13px] font-semibold">Google Play</span>
        </span>
      </a>
    );
  }

  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={[
        'inline-flex items-center gap-3 rounded-xl border border-white/20 bg-[#0f0f10] px-4 py-2.5 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:bg-[#1a1a1c] transition-colors',
        className ?? ''
      ].join(' ').trim()}
      aria-label="Download TransConnect app from Google Play"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10">
        <Play className="h-3.5 w-3.5 fill-current" />
      </div>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-[0.08em] text-white/75">GET IT ON</span>
        <span className="block text-sm font-semibold">Google Play</span>
      </span>
    </a>
  );
}
