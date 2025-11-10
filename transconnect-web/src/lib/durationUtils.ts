/**
 * Duration Utilities for TransConnect App
 * Provides consistent duration formatting across the application
 */

/**
 * Format duration in minutes to human-readable string
 * @param minutes Duration in minutes
 * @returns Formatted string like "2h 30m", "1h", "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0 minutes';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  } else if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Format duration in minutes to short format for display in lists
 * @param minutes Duration in minutes  
 * @returns Short formatted string like "2h 30m", "1h", "45m"
 */
export function formatDurationShort(minutes: number): string {
  if (minutes === 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Parse duration string to minutes
 * Supports formats: "2h 30m", "1h", "45m", "90 minutes", "90"
 * @param durationStr Duration string
 * @returns Duration in minutes
 */
export function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  
  // Handle "Xh Ym" format
  const hoursMinutesMatch = durationStr.match(/(\d+)h\s*(\d+)m/);
  if (hoursMinutesMatch) {
    return parseInt(hoursMinutesMatch[1]) * 60 + parseInt(hoursMinutesMatch[2]);
  }
  
  // Handle "Xh" format
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    return parseInt(hoursMatch[1]) * 60;
  }
  
  // Handle "Xm" or "X minutes" format
  const minutesMatch = durationStr.match(/(\d+)\s*(m|min|minutes?)/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1]);
  }
  
  // Handle plain number (assume minutes)
  const numberMatch = durationStr.match(/^\d+$/);
  if (numberMatch) {
    return parseInt(durationStr);
  }
  
  return 0;
}

/**
 * Convert hours and minutes to total minutes
 * @param hours Number of hours
 * @param minutes Number of minutes
 * @returns Total minutes
 */
export function hoursMinutesToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/**
 * Convert total minutes to hours and minutes
 * @param totalMinutes Total minutes
 * @returns Object with hours and minutes
 */
export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
}

/**
 * Validate duration input
 * @param hours Hours input (0-24)
 * @param minutes Minutes input (0-59)
 * @returns Validation result with error message if invalid
 */
export function validateDuration(hours: number, minutes: number): { isValid: boolean; error?: string } {
  if (hours < 0 || hours > 24) {
    return { isValid: false, error: 'Hours must be between 0 and 24' };
  }
  
  if (minutes < 0 || minutes > 59) {
    return { isValid: false, error: 'Minutes must be between 0 and 59' };
  }
  
  if (hours === 0 && minutes === 0) {
    return { isValid: false, error: 'Duration must be greater than 0' };
  }
  
  return { isValid: true };
}

/**
 * Common duration presets for quick selection
 */
export const DURATION_PRESETS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2 hours', minutes: 120 },
  { label: '2h 30m', minutes: 150 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
  { label: '5 hours', minutes: 300 },
  { label: '6 hours', minutes: 360 }
];

/**
 * Format duration for API requests (ensure it's always in minutes)
 * @param duration Duration in various formats
 * @returns Duration in minutes for API
 */
export function formatDurationForAPI(duration: number | string): number {
  if (typeof duration === 'number') {
    return duration;
  }
  
  return parseDuration(duration);
}

/**
 * Get duration color based on length (for UI styling)
 * @param minutes Duration in minutes
 * @returns CSS color class
 */
export function getDurationColor(minutes: number): string {
  if (minutes <= 60) return 'text-green-600';      // <= 1 hour: green
  if (minutes <= 180) return 'text-yellow-600';    // <= 3 hours: yellow  
  if (minutes <= 360) return 'text-orange-600';    // <= 6 hours: orange
  return 'text-red-600';                           // > 6 hours: red
}

/**
 * Get duration badge style based on length
 * @param minutes Duration in minutes
 * @returns CSS classes for duration badge
 */
export function getDurationBadgeStyle(minutes: number): string {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
  
  if (minutes <= 60) return `${baseClasses} bg-green-100 text-green-800`;
  if (minutes <= 180) return `${baseClasses} bg-yellow-100 text-yellow-800`;
  if (minutes <= 360) return `${baseClasses} bg-orange-100 text-orange-800`;
  return `${baseClasses} bg-red-100 text-red-800`;
}