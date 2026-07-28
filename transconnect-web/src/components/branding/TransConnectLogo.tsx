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
  const safeWidth = Math.max(width, 24);

  return (
    <div className={['inline-flex min-w-0 items-center gap-2.5', className ?? ''].join(' ').trim()}>
      <div
        className={[
          'inline-flex items-center justify-center shrink-0',
          usage === 'dark' ? 'bg-white rounded-md px-2 py-1.5' : ''
        ].join(' ').trim()}
      >
        <Image
          src="/branding/transconnect-logo.png"
          alt="TransConnect logo"
          width={safeWidth}
          height={height}
          priority={priority}
          className={[
            'h-auto w-auto max-w-full object-contain',
            imageClassName ?? ''
          ].join(' ').trim()}
        />
      </div>
      {showWordmark && (
        <span
          className={[
            'tc-font-brand text-base sm:text-lg md:text-xl leading-none font-bold whitespace-nowrap tracking-tight',
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
