/**
 * Feature Flags - Control feature availability across environments
 * 
 * This utility provides a centralized way to enable/disable features
 * based on environment variables. Use this to:
 * - Hide incomplete features from production
 * - Enable features in staging/development only
 * - Perform gradual rollouts
 * 
 * Usage:
 * ```typescript
 * import { isFeatureEnabled, requireFeature } from '../utils/feature-flags';
 * 
 * // In route handlers
 * router.use(requireFeature('OPERATOR_PORTAL'));
 * 
 * // In business logic
 * if (isFeatureEnabled('OPERATOR_PORTAL')) {
 *   // Feature code
 * }
 * ```
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Available feature flags
 * Add new features here as they are developed
 */
export const FEATURE_FLAGS = {
  // Operator Portal Feature (Phase 1 MVP)
  OPERATOR_PORTAL: process.env.ENABLE_OPERATOR_PORTAL === 'true',
  
  // Operator Portal Configuration UI (Admin Dashboard)
  OPERATOR_PORTAL_CONFIG: process.env.ENABLE_OPERATOR_PORTAL_CONFIG === 'true',
  
  // Operator Portal Analytics (Phase 2)
  OPERATOR_PORTAL_ANALYTICS: process.env.ENABLE_OPERATOR_PORTAL_ANALYTICS === 'true',
  
  // Operator Portal Custom Domains (Phase 3 Premium)
  OPERATOR_PORTAL_CUSTOM_DOMAINS: process.env.ENABLE_OPERATOR_PORTAL_CUSTOM_DOMAINS === 'true',
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
 *   // Show operator portal
 * }
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  const enabled = FEATURE_FLAGS[feature];
  
  // Log feature flag checks in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Feature Flag] ${feature}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  }
  
  return enabled === true;
}

/**
 * Express middleware to require a feature flag
 * Returns 404 if feature is disabled
 * 
 * @param feature - The feature flag to require
 * @returns Express middleware function
 * 
 * @example
 * router.use('/operator-portal', requireFeature('OPERATOR_PORTAL'));
 * router.get('/slug/:slug', async (req, res) => {
 *   // This endpoint only accessible if OPERATOR_PORTAL is enabled
 * });
 */
export function requireFeature(feature: FeatureFlag) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(feature)) {
      return res.status(404).json({
        error: 'Feature not available',
        message: `The requested feature (${feature}) is not currently available.`,
        feature,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Feature is enabled, continue to next middleware
    next();
  };
}

/**
 * Get all feature flags and their states
 * Useful for debugging and admin dashboards
 * 
 * @returns Object with all feature flags and their current state
 * 
 * @example
 * const flags = getAllFeatureFlags();
 * console.log('OPERATOR_PORTAL:', flags.OPERATOR_PORTAL);
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...FEATURE_FLAGS };
}

/**
 * Check if ANY of the provided features is enabled
 * Useful for enabling functionality if any related feature is active
 * 
 * @param features - Array of feature flags to check
 * @returns true if at least one feature is enabled
 * 
 * @example
 * if (isAnyFeatureEnabled(['OPERATOR_PORTAL', 'OPERATOR_PORTAL_CONFIG'])) {
 *   // Show operator portal section
 * }
 */
export function isAnyFeatureEnabled(features: FeatureFlag[]): boolean {
  return features.some(feature => isFeatureEnabled(feature));
}

/**
 * Check if ALL provided features are enabled
 * Useful for functionality that requires multiple features
 * 
 * @param features - Array of feature flags to check
 * @returns true if all features are enabled
 * 
 * @example
 * if (areAllFeaturesEnabled(['OPERATOR_PORTAL', 'OPERATOR_PORTAL_ANALYTICS'])) {
 *   // Show analytics dashboard
 * }
 */
export function areAllFeaturesEnabled(features: FeatureFlag[]): boolean {
  return features.every(feature => isFeatureEnabled(feature));
}

// Export for easy access
export default {
  FEATURE_FLAGS,
  isFeatureEnabled,
  requireFeature,
  getAllFeatureFlags,
  isAnyFeatureEnabled,
  areAllFeaturesEnabled,
};
