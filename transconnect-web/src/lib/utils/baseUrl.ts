/**
 * Utility function to get the current application base URL
 * Works in both client and server environments
 */

export function getBaseUrl(): string {
  // Client-side: use window.location
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // Server-side or build time: use environment variables
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback for development
  return 'http://localhost:3000';
}

export function getReferralLink(referralCode: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/agents/register?ref=${referralCode}`;
}