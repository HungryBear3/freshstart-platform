/**
 * UTM Parameter Tracking
 * 
 * Captures and stores UTM parameters for marketing attribution.
 * UTM parameters are stored in localStorage and can be attached
 * to user records on signup for conversion attribution.
 */

export interface UTMParams {
  utm_source?: string    // Traffic source: google, facebook, influencer, youtube, etc.
  utm_medium?: string    // Marketing medium: cpc, organic_social, email, referral, video
  utm_campaign?: string  // Campaign name: spring_sale, launch_2026, etc.
  utm_term?: string      // Paid search keyword
  utm_content?: string   // Ad/content variation: video_title, ad_version_a, etc.
}

const UTM_STORAGE_KEY = 'utm_params'
const UTM_TIMESTAMP_KEY = 'utm_timestamp'
const UTM_EXPIRY_DAYS = 30  // Attribution window

/**
 * Capture UTM parameters from current URL
 * Stores them in localStorage for attribution across sessions
 * 
 * @returns Captured UTM parameters, or empty object if none present
 */
export function captureUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {}
  
  const params = new URLSearchParams(window.location.search)
  const utm: UTMParams = {}
  
  const utmKeys: (keyof UTMParams)[] = [
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_term',
    'utm_content'
  ]
  
  utmKeys.forEach(key => {
    const value = params.get(key)
    if (value) {
      utm[key] = value
    }
  })
  
  // Only store if we have UTM params
  if (Object.keys(utm).length > 0) {
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm))
      localStorage.setItem(UTM_TIMESTAMP_KEY, Date.now().toString())
    } catch (e) {
      // localStorage might be unavailable
      console.warn('Could not store UTM params:', e)
    }
  }
  
  return utm
}

/**
 * Get stored UTM parameters from localStorage
 * Returns null if expired or not present
 */
export function getStoredUTMParams(): UTMParams | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY)
    const timestamp = localStorage.getItem(UTM_TIMESTAMP_KEY)
    
    if (!stored || !timestamp) return null
    
    // Check if expired
    const storedTime = parseInt(timestamp, 10)
    const expiryTime = storedTime + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    
    if (Date.now() > expiryTime) {
      // Clear expired data
      clearUTMParams()
      return null
    }
    
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Clear stored UTM parameters
 */
export function clearUTMParams(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(UTM_STORAGE_KEY)
    localStorage.removeItem(UTM_TIMESTAMP_KEY)
  } catch {
    // Ignore errors
  }
}

/**
 * Get attribution data for API calls
 * Returns UTM params formatted for database storage
 */
export function getAttributionData(): {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
} | null {
  const utm = getStoredUTMParams()
  if (!utm) return null
  
  return {
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    utmTerm: utm.utm_term,
    utmContent: utm.utm_content,
  }
}

/**
 * Get attribution source summary for display
 */
export function getAttributionSummary(): string {
  const utm = getStoredUTMParams()
  if (!utm) return 'Direct'
  
  if (utm.utm_source === 'google' && utm.utm_medium === 'cpc') {
    return 'Google Ads'
  }
  if (utm.utm_source === 'facebook' || utm.utm_source === 'instagram') {
    return `${utm.utm_medium === 'cpc' ? 'Meta Ads' : 'Social'}`
  }
  if (utm.utm_source === 'youtube') {
    return 'YouTube'
  }
  if (utm.utm_medium === 'influencer' || utm.utm_source === 'influencer') {
    return `Influencer${utm.utm_campaign ? `: ${utm.utm_campaign}` : ''}`
  }
  if (utm.utm_source) {
    return utm.utm_source.charAt(0).toUpperCase() + utm.utm_source.slice(1)
  }
  
  return 'Referral'
}

/**
 * Build a tracking URL with UTM parameters
 * 
 * @param baseUrl - The base URL
 * @param params - UTM parameters to append
 * @returns Full URL with UTM parameters
 */
export function buildTrackingUrl(
  baseUrl: string,
  params: UTMParams
): string {
  const url = new URL(baseUrl)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })
  
  return url.toString()
}

/**
 * Pre-built UTM parameter sets for common sources
 */
export const utmTemplates = {
  googleAds: (campaign: string): UTMParams => ({
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: campaign,
  }),
  
  facebookAds: (campaign: string): UTMParams => ({
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: campaign,
  }),
  
  instagramAds: (campaign: string): UTMParams => ({
    utm_source: 'instagram',
    utm_medium: 'cpc',
    utm_campaign: campaign,
  }),
  
  youtube: (videoTitle: string, campaign?: string): UTMParams => ({
    utm_source: 'youtube',
    utm_medium: 'video',
    utm_campaign: campaign || 'youtube_organic',
    utm_content: videoTitle,
  }),
  
  tiktok: (campaign?: string): UTMParams => ({
    utm_source: 'tiktok',
    utm_medium: 'organic_social',
    utm_campaign: campaign || 'tiktok_organic',
  }),
  
  influencer: (influencerName: string, campaign?: string): UTMParams => ({
    utm_source: 'influencer',
    utm_medium: 'referral',
    utm_campaign: influencerName.toLowerCase().replace(/\s+/g, '_'),
    utm_content: campaign,
  }),
  
  email: (campaign: string): UTMParams => ({
    utm_source: 'email',
    utm_medium: 'email',
    utm_campaign: campaign,
  }),
}
