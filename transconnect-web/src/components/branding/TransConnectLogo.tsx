import Image from 'next/image';
import React from 'react';

type TransConnectLogoProps = {
  className?: string;
  imageClassName?: string;
  wordmarkClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  usage?: 'light' | 'dark';
  showWordmark?: boolean;
};

export default function TransConnectLogo({
  className,
  imageClassName,
  wordmarkClassName,
  width = 168,
  height = 48,
  priority = false,
  usage = 'light',
  showWordmark = true
}: TransConnectLogoProps) {
  const safeWidth = Math.max(width, 80);

  return (
    <div className={['inline-flex items-center gap-2.5 shrink-0', className ?? ''].join(' ').trim()}>
      <div
        className={[
          'inline-flex items-center justify-center shrink-0',
          usage === 'dark' ? 'bg-white rounded-md px-3 py-2' : ''
        ].join(' ').trim()}
      >
        <Image
          src="/branding/transconnect-logo.png"
          alt="TransConnect logo"
          width={safeWidth}
          height={height}
          priority={priority}
          className={[
            'h-auto w-auto object-contain max-w-none',
            imageClassName ?? ''
          ].join(' ').trim()}
        />
      </div>
      {showWordmark && (
        <span
          className={[
            'tc-font-brand text-lg sm:text-xl leading-none font-bold whitespace-nowrap tracking-tight',
            usage === 'dark' ? 'text-white' : 'text-[#0d1b2a]',
            wordmarkClassName ?? ''
          ].join(' ').trim()}
          aria-label="TransConnect"
        >
          {usage === 'dark' ? (
            'TransConnect'
          ) : (
            <>
              <span>Trans</span>
              <span className="text-[#2f6faa]">Connect</span>
            </>
          )}
        </span>
      )}
    </div>
  );
}
