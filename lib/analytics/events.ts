/**
 * Analytics Event Tracking
 *
 * Unified event tracking for GA4, Meta Pixel, and Google Ads.
 *
 * Every dispatch is wrapped by `isLiveTrackingEnabled()` from
 * `lib/analytics/tracking-gate.ts` so that Vercel Preview, localhost, and
 * any non-production host become a no-op. This is defense-in-depth on top
 * of the AnalyticsProvider gate.
 */

import { trackMetaEvent, trackMetaCustomEvent } from "@/components/analytics/meta-pixel"
import { isLiveTrackingEnabled } from "@/lib/analytics/tracking-gate"
import { sanitizeClientEventParams } from "@/lib/analytics/ga4-client"

// ============================================================
// CORE EVENT TRACKING
// ============================================================

/**
 * Track an event to Google Analytics 4. No-op when the production tracking
 * gate is closed (Preview, localhost, dev, missing opt-in env var).
 *
 * Measurement is never allowed to interfere with the journey it measures, so
 * a misbehaving tag is swallowed here rather than surfacing to the intake,
 * document, or checkout caller.
 */
export function trackGA4Event(
  eventName: string,
  params?: Record<string, any>
): void {
  try {
    if (!isLiveTrackingEnabled()) return
    const sanitized = sanitizeClientEventParams(eventName, params)
    if (sanitized === null) return
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, sanitized)
    }
  } catch {
    // Never propagate an analytics failure into product behavior.
  }
}

/**
 * Track an event to all configured platforms. Same production-only gate
 * as `trackGA4Event` — dev/preview still gets the console line so QA
 * can verify the call site fired, but no live pixel/tag is touched.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (isLiveTrackingEnabled()) {
    trackGA4Event(eventName, params)
  }

  // Log in development (no live network call).
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, params)
  }
}

// ============================================================
// TYPED EVENT HELPERS
// ============================================================

/**
 * Pre-configured analytics events for FreshStart IL
 */
export const analytics = {
  // ========== USER EVENTS ==========
  
  /**
   * Track user signup
   */
  signUp: (method: 'email' | 'google' | 'github', utmParams?: Record<string, string>) => {
    trackEvent('sign_up', { method, ...utmParams })
    trackMetaEvent('Lead', { content_name: 'signup', method })
  },

  /**
   * Track user login
   */
  login: (method: 'email' | 'google' | 'github') => {
    trackEvent('login', { method })
  },

  /**
   * Track page view (manual, for SPA navigation)
   */
  pageView: (pagePath: string, pageTitle?: string) => {
    trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    })
  },

  // ========== QUESTIONNAIRE EVENTS ==========

  /**
   * Track questionnaire started.
   *
   * Only the bounded questionnaire type is reported. The human-readable
   * questionnaire title is deliberately not sent: it is free-form copy, it
   * fails the client sanitizer, and it would drop the whole event.
   */
  questionnaireStart: (questionnaireType: string) => {
    trackEvent('questionnaire_start', {
      questionnaire_type: questionnaireType,
    })
    trackMetaCustomEvent('QuestionnaireStart', {
      questionnaire_type: questionnaireType,
    })
  },

  /**
   * Track questionnaire section completed. `sectionIndex` is the zero-based
   * index of the section that was just cleared, so progress counts it.
   */
  questionnaireSectionComplete: (
    questionnaireType: string,
    sectionIndex: number,
    totalSections: number
  ) => {
    trackEvent('questionnaire_section_complete', {
      questionnaire_type: questionnaireType,
      section_index: sectionIndex,
      total_sections: totalSections,
      progress_percent: Math.round(((sectionIndex + 1) / totalSections) * 100),
    })
  },

  /**
   * Track questionnaire completed. Bounded type only — see `questionnaireStart`.
   */
  questionnaireComplete: (questionnaireType: string) => {
    trackEvent('questionnaire_complete', {
      questionnaire_type: questionnaireType,
    })
    trackMetaEvent('CompleteRegistration', {
      content_name: questionnaireType,
    })
  },

  /**
   * Track questionnaire abandoned (user leaves before completing)
   */
  questionnaireAbandon: (
    questionnaireType: string,
    lastSectionIndex: number,
    totalSections: number
  ) => {
    trackEvent('questionnaire_abandon', {
      questionnaire_type: questionnaireType,
      last_section: lastSectionIndex,
      total_sections: totalSections,
      progress_percent: Math.round((lastSectionIndex / totalSections) * 100),
    })
  },

  // ========== DOCUMENT EVENTS ==========

  /**
   * Track document generation started
   */
  documentGenerateStart: (documentType: string, isOfficialForm: boolean) => {
    trackEvent('document_generate_start', {
      document_type: documentType,
      is_official_form: isOfficialForm,
    })
  },

  /**
   * Track document generated successfully
   */
  documentGenerate: (documentType: string, isOfficialForm: boolean) => {
    trackEvent('document_generate', {
      document_type: documentType,
      is_official_form: isOfficialForm,
    })
    trackMetaCustomEvent('DocumentGenerate', {
      document_type: documentType,
    })
  },

  /**
   * Track document downloaded
   */
  documentDownload: (documentType: string, fileName: string) => {
    trackEvent('document_download', {
      document_type: documentType,
      file_name: fileName,
    })
  },

  /**
   * Track document package downloaded (all documents as ZIP)
   */
  documentPackageDownload: (documentCount: number) => {
    trackEvent('document_package_download', {
      document_count: documentCount,
    })
  },

  // ========== SUBSCRIPTION EVENTS ==========

  /**
   * Track subscription checkout started
   */
  subscriptionStart: (planName: string, planPrice: number) => {
    trackEvent('begin_checkout', {
      currency: 'USD',
      value: planPrice,
      items: [{
        item_name: planName,
        price: planPrice,
        quantity: 1,
      }],
    })
    trackMetaEvent('InitiateCheckout', {
      content_name: planName,
      currency: 'USD',
      value: planPrice,
    })
  },


  /**
   * Track trial started
   */
  trialStart: (planName: string, trialDays: number) => {
    trackEvent('trial_start', {
      plan_name: planName,
      trial_days: trialDays,
    })
    trackMetaEvent('StartTrial', {
      content_name: planName,
      predicted_ltv: 299, // Annual subscription value
    })
  },

  /**
   * Track subscription cancelled
   */
  subscriptionCancel: (planName: string, reason?: string) => {
    trackEvent('subscription_cancel', {
      plan_name: planName,
      cancel_reason: reason,
    })
  },

  // ========== FORM LIBRARY EVENTS ==========

  /**
   * Track court form viewed in library
   */
  courtFormView: (formId: string, formName: string) => {
    trackEvent('court_form_view', {
      form_id: formId,
      form_name: formName,
    })
  },

  /**
   * Track court form downloaded from library
   */
  courtFormDownload: (formId: string, formName: string) => {
    trackEvent('court_form_download', {
      form_id: formId,
      form_name: formName,
    })
  },

  // ========== E-FILING EVENTS ==========

  /**
   * Track e-filing guidance viewed
   */
  efilingGuideView: (section: string) => {
    trackEvent('efiling_guide_view', {
      section,
    })
  },

  // ========== ENGAGEMENT EVENTS ==========

  /**
   * Track legal info page viewed
   */
  legalInfoView: (pageSlug: string) => {
    trackEvent('legal_info_view', {
      page_slug: pageSlug,
    })
  },

  /**
   * Track calculator used
   */
  calculatorUse: (calculatorType: 'cost' | 'timeline' | 'child_support') => {
    trackEvent('calculator_use', {
      calculator_type: calculatorType,
    })
  },

  /**
   * Track search performed
   */
  search: (searchTerm: string, resultsCount?: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    })
  },

  // ========== PRENUP EVENTS ==========

  /**
   * Track prenup section started in questionnaire
   */
  prenupSectionStart: (questionnaireType: string) => {
    trackEvent('prenup_section_start', {
      questionnaire_type: questionnaireType,
    })
  },

  /**
   * Track prenup section completed
   */
  prenupSectionComplete: (questionnaireType: string, hasPrenup: boolean) => {
    trackEvent('prenup_section_complete', {
      questionnaire_type: questionnaireType,
      has_prenup: hasPrenup,
    })
  },

  /**
   * Track prenup document uploaded
   */
  prenupDocumentUpload: (documentType: 'prenup' | 'postnup' | 'amendment', fileSize?: number) => {
    trackEvent('prenup_document_upload', {
      document_type: documentType,
      file_size: fileSize,
    })
    trackMetaCustomEvent('PrenupDocumentUpload', {
      document_type: documentType,
    })
  },

  /**
   * Track prenup status classification
   */
  prenupStatusClassified: (status: 'none' | 'uncontested' | 'disputed' | 'unclear') => {
    trackEvent('prenup_status_classified', {
      prenup_status: status,
    })
  },

  /**
   * Track safety concerns detected
   */
  prenupSafetyConcernsDetected: (concernTypes: string[]) => {
    trackEvent('prenup_safety_concerns_detected', {
      concern_types: concernTypes,
      concern_count: concernTypes.length,
    })
  },

  /**
   * Track safety resources viewed
   */
  prenupSafetyResourcesView: () => {
    trackEvent('prenup_safety_resources_view', {})
  },

  /**
   * Track prenup guidance banner viewed
   */
  prenupGuidanceBannerView: (status: 'uncontested' | 'disputed' | 'unclear') => {
    trackEvent('prenup_guidance_banner_view', {
      prenup_status: status,
    })
  },

  // ========== ERROR EVENTS ==========

  /**
   * Track error occurred
   */
  error: (errorType: string, errorMessage: string, context?: string) => {
    trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_context: context,
    })
  },
}

// ============================================================
// UTM PARAMETER INTEGRATION
// ============================================================

/**
 * Get stored UTM parameters and include in event
 */
export function getStoredUTMForEvent(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem('utm_params')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  
  return {}
}

/**
 * Track signup with UTM attribution
 */
export function trackSignupWithAttribution(method: 'email' | 'google' | 'github'): void {
  const utmParams = getStoredUTMForEvent()
  analytics.signUp(method, utmParams)
}
