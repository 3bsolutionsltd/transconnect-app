/**
 * Feature Flags - Frontend Configuration
 * 
 * Controls feature availability on the client-side.
 * Features are controlled via environment variables prefixed with NEXT_PUBLIC_
 * 
 * IMPORTANT: These variables are embedded in the client bundle at build time.
 * Changes require a rebuild to take effect.
 * 
 * Usage:
 * ```typescript
 * import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';
 * 
 * // Check if feature is enabled
 * if (isFeatureEnabled('OPERATOR_PORTAL')) {
 *   // Show operator portal UI
 * }
 * 
 * // Use in components
 * {FEATURE_FLAGS.OPERATOR_PORTAL && <OperatorPortalLink />}
 * ```
 */

/**
 * Available feature flags
 * Synced with backend feature flags for consistency
 */
export const FEATURE_FLAGS = {
  // PWA and Notifications (existing features)
  PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  
  // Operator Portal Feature (Phase 1 MVP)
  OPERATOR_PORTAL: process.env.NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL === 'true',
  
  // Operator Portal Configuration UI (Admin Dashboard)
  OPERATOR_PORTAL_CONFIG: process.env.NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL_CONFIG === 'true',
  
  // Operator Portal Analytics (Phase 2)
  OPERATOR_PORTAL_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL_ANALYTICS === 'true',
  
  // Operator Portal Custom Domains (Phase 3 Premium)
  OPERATOR_PORTAL_CUSTOM_DOMAINS: process.env.NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL_CUSTOM_DOMAINS === 'true',
} as const;

/**
 * Type-safe feature flag keys
 */
export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 * 
 * @param feature - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 * 
 * @example
 * if (isFeatureEnabled('OPERATOR_PORTAL')) {
 *   return <OperatorPortal />;
 * }
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  const enabled = FEATURE_FLAGS[feature];
  
  // Log feature flag checks in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log(`[Feature Flag] ${feature}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  }
  
  return enabled === true;
}

/**
 * Get all feature flags and their states
 * Useful for debugging and feature dashboards
 * 
 * @returns Object with all feature flags and their current state
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...FEATURE_FLAGS };
}

/**
 * Check if ANY of the provided features is enabled
 * 
 * @param features - Array of feature flags to check
 * @returns true if at least one feature is enabled
 * 
 * @example
 * if (isAnyFeatureEnabled(['OPERATOR_PORTAL', 'OPERATOR_PORTAL_CONFIG'])) {
 *   // Show operator portal menu item
 * }
 */
export function isAnyFeatureEnabled(features: FeatureFlag[]): boolean {
  return features.some(feature => isFeatureEnabled(feature));
}

/**
 * Check if ALL provided features are enabled
 * 
 * @param features - Array of feature flags to check
 * @returns true if all features are enabled
 * 
 * @example
 * if (areAllFeaturesEnabled(['OPERATOR_PORTAL', 'OPERATOR_PORTAL_ANALYTICS'])) {
 *   return <AnalyticsDashboard />;
 * }
 */
export function areAllFeaturesEnabled(features: FeatureFlag[]): boolean {
  return features.every(feature => isFeatureEnabled(feature));
}

/**
 * React Hook: Check if feature is enabled
 * Can be used in React components for conditional rendering
 * 
 * @param feature - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 * 
 * @example
 * function MyComponent() {
 *   const showPortal = useFeatureFlag('OPERATOR_PORTAL');
 *   
 *   if (!showPortal) return null;
 *   return <OperatorPortal />;
 * }
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  return isFeatureEnabled(feature);
}

/**
 * HOC: Wrap a component to only render if feature is enabled
 * 
 * @param feature - The feature flag to check
 * @param Component - The component to wrap
 * @param fallback - Optional fallback component if feature is disabled
 * 
 * @example
 * const OperatorPortalPage = withFeatureFlag(
 *   'OPERATOR_PORTAL',
 *   OperatorPortalComponent,
 *   <NotFoundPage />
 * );
 */
export function withFeatureFlag<P extends object>(
  feature: FeatureFlag,
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function FeatureFlaggedComponent(props: P) {
    if (!isFeatureEnabled(feature)) {
      return fallback || null;
    }
    return <Component {...props} />;
  };
}

// Export for easy access
export default {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getAllFeatureFlags,
  isAnyFeatureEnabled,
  areAllFeaturesEnabled,
  useFeatureFlag,
  withFeatureFlag,
};
