type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, props: AnalyticsProps = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    event: eventName,
    ...props,
  };

  // Send to Google Analytics if available
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, props);
  }

  // Push to dataLayer for GTM setups
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }

  // Lightweight debug signal in development
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[analytics]', payload);
  }
}
