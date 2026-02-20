/**
 * Analytics Library
 * 
 * Export all analytics utilities
 */

export {
  trackGA4Event,
  trackEvent,
  analytics,
  getStoredUTMForEvent,
  trackSignupWithAttribution,
} from './events'

export {
  type UTMParams,
  captureUTMParams,
  getStoredUTMParams,
  clearUTMParams,
  getAttributionData,
  getAttributionSummary,
  buildTrackingUrl,
  utmTemplates,
} from './utm-tracking'
