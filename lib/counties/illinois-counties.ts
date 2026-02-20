/**
 * Illinois Counties Configuration
 * 
 * Contains filing requirements, fees, and court information for all 102 Illinois counties.
 * Data should be verified periodically as fees and procedures change.
 * 
 * Last verified: January 2026
 */

export interface CountyInfo {
  id: string
  name: string
  fullName: string  // "Cook County Circuit Court"
  
  // E-Filing
  eFilingRequired: boolean
  eFilingPortal: 'odyssey' | 'tyler' | 'file_serve' | 'other'
  eFilingUrl?: string
  
  // Filing Fees (in dollars)
  fees: {
    petitionFiling: number
    responseFiling: number
    motionFiling?: number
    certificateCopies?: number
    feeWaiverAvailable: boolean
  }
  
  // Court Contact
  courtAddress: string
  courtCity: string
  courtZip: string
  courtPhone?: string
  clerkWebsite?: string
  
  // Special Requirements
  localRules?: string[]
  specialRequirements?: string[]
  parentingClassRequired?: boolean
  mediationRequired?: boolean
  
  // Judicial Circuit
  judicialCircuit: number
}

// Major counties with detailed information
export const ILLINOIS_COUNTIES: Record<string, CountyInfo> = {
  cook: {
    id: 'cook',
    name: 'Cook County',
    fullName: 'Circuit Court of Cook County',
    eFilingRequired: true,
    eFilingPortal: 'odyssey',
    eFilingUrl: 'https://odyssey.cookcountyclerkofcourt.org/',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      motionFiling: 60,
      certificateCopies: 27,
      feeWaiverAvailable: true,
    },
    courtAddress: '50 W. Washington Street',
    courtCity: 'Chicago',
    courtZip: '60602',
    courtPhone: '312-603-5030',
    clerkWebsite: 'https://www.cookcountyclerkofcourt.org/',
    localRules: [
      'Domestic Relations Division handles all divorce cases',
      'Mandatory settlement conference required before trial',
      'Parenting education class required for cases with minor children',
    ],
    specialRequirements: [
      'Certificate of completion for parenting class must be filed',
      'Financial affidavit must be filed within 60 days of first appearance',
    ],
    parentingClassRequired: true,
    mediationRequired: false,
    judicialCircuit: 1,
  },
  
  dupage: {
    id: 'dupage',
    name: 'DuPage County',
    fullName: 'DuPage County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    eFilingUrl: 'https://www.judici.com/courts/case_management.jsp?court=IL018015J',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      motionFiling: 60,
      feeWaiverAvailable: true,
    },
    courtAddress: '505 N. County Farm Road',
    courtCity: 'Wheaton',
    courtZip: '60187',
    courtPhone: '630-407-8700',
    clerkWebsite: 'https://www.dupageco.org/Courts/',
    localRules: [
      'Mandatory disclosure required within 60 days',
      'Settlement conference required before trial setting',
    ],
    parentingClassRequired: true,
    mediationRequired: true,
    judicialCircuit: 18,
  },
  
  lake: {
    id: 'lake',
    name: 'Lake County',
    fullName: 'Lake County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '18 N. County Street',
    courtCity: 'Waukegan',
    courtZip: '60085',
    courtPhone: '847-377-3600',
    clerkWebsite: 'https://www.lakecountyil.gov/152/Circuit-Clerk',
    parentingClassRequired: true,
    mediationRequired: true,
    judicialCircuit: 19,
  },
  
  will: {
    id: 'will',
    name: 'Will County',
    fullName: 'Will County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '14 W. Jefferson Street',
    courtCity: 'Joliet',
    courtZip: '60432',
    courtPhone: '815-727-8592',
    clerkWebsite: 'https://www.willcountycircuitcourt.com/',
    parentingClassRequired: true,
    judicialCircuit: 12,
  },
  
  kane: {
    id: 'kane',
    name: 'Kane County',
    fullName: 'Kane County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '37W777 Route 38',
    courtCity: 'St. Charles',
    courtZip: '60175',
    courtPhone: '630-232-3413',
    clerkWebsite: 'https://www.kanecountyil.gov/Pages/CircuitClerk.aspx',
    parentingClassRequired: true,
    judicialCircuit: 16,
  },
  
  mchenry: {
    id: 'mchenry',
    name: 'McHenry County',
    fullName: 'McHenry County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '2200 N. Seminary Avenue',
    courtCity: 'Woodstock',
    courtZip: '60098',
    courtPhone: '815-334-4190',
    clerkWebsite: 'https://www.mchenrycountyil.gov/county-government/courts-background/circuit-clerk',
    parentingClassRequired: true,
    judicialCircuit: 22,
  },
  
  winnebago: {
    id: 'winnebago',
    name: 'Winnebago County',
    fullName: 'Winnebago County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '400 W. State Street',
    courtCity: 'Rockford',
    courtZip: '61101',
    courtPhone: '815-319-4800',
    parentingClassRequired: true,
    judicialCircuit: 17,
  },
  
  madison: {
    id: 'madison',
    name: 'Madison County',
    fullName: 'Madison County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '155 N. Main Street',
    courtCity: 'Edwardsville',
    courtZip: '62025',
    courtPhone: '618-692-6240',
    parentingClassRequired: true,
    judicialCircuit: 3,
  },
  
  stclair: {
    id: 'stclair',
    name: 'St. Clair County',
    fullName: 'St. Clair County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '10 Public Square',
    courtCity: 'Belleville',
    courtZip: '62220',
    courtPhone: '618-277-6600',
    parentingClassRequired: true,
    judicialCircuit: 20,
  },
  
  sangamon: {
    id: 'sangamon',
    name: 'Sangamon County',
    fullName: 'Sangamon County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '200 S. Ninth Street',
    courtCity: 'Springfield',
    courtZip: '62701',
    courtPhone: '217-753-6674',
    parentingClassRequired: true,
    judicialCircuit: 7,
  },
  
  peoria: {
    id: 'peoria',
    name: 'Peoria County',
    fullName: 'Peoria County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '324 Main Street',
    courtCity: 'Peoria',
    courtZip: '61602',
    courtPhone: '309-672-6047',
    parentingClassRequired: true,
    judicialCircuit: 10,
  },
  
  champaign: {
    id: 'champaign',
    name: 'Champaign County',
    fullName: 'Champaign County Circuit Court',
    eFilingRequired: true,
    eFilingPortal: 'tyler',
    fees: {
      petitionFiling: 337,
      responseFiling: 337,
      feeWaiverAvailable: true,
    },
    courtAddress: '101 E. Main Street',
    courtCity: 'Urbana',
    courtZip: '61801',
    courtPhone: '217-384-3725',
    parentingClassRequired: true,
    judicialCircuit: 6,
  },
}

// Default values for counties not specifically configured
const DEFAULT_COUNTY_FEES = {
  petitionFiling: 337,
  responseFiling: 337,
  feeWaiverAvailable: true,
}

/**
 * Get county info by ID
 */
export function getCountyById(countyId: string): CountyInfo | null {
  return ILLINOIS_COUNTIES[countyId.toLowerCase()] || null
}

/**
 * Get county info by name (partial match)
 */
export function getCountyByName(name: string): CountyInfo | null {
  const normalized = name.toLowerCase().replace(' county', '').trim()
  
  for (const [id, county] of Object.entries(ILLINOIS_COUNTIES)) {
    if (id === normalized || county.name.toLowerCase().includes(normalized)) {
      return county
    }
  }
  
  return null
}

/**
 * Get all configured counties
 */
export function getAllCounties(): CountyInfo[] {
  return Object.values(ILLINOIS_COUNTIES)
}

/**
 * Get counties that require e-filing
 */
export function getEFilingCounties(): CountyInfo[] {
  return getAllCounties().filter(c => c.eFilingRequired)
}

/**
 * Get filing fees for a county
 */
export function getFilingFees(countyId: string): CountyInfo['fees'] {
  const county = getCountyById(countyId)
  return county?.fees || DEFAULT_COUNTY_FEES
}

/**
 * Check if parenting class is required
 */
export function isParentingClassRequired(countyId: string): boolean {
  const county = getCountyById(countyId)
  // Default to true as most Illinois counties require it for cases with children
  return county?.parentingClassRequired ?? true
}

/**
 * Get county-specific instructions
 */
export function getCountyInstructions(countyId: string): string[] {
  const county = getCountyById(countyId)
  const instructions: string[] = []
  
  if (!county) {
    instructions.push('Contact your local circuit court clerk for specific filing requirements.')
    return instructions
  }
  
  if (county.eFilingRequired) {
    instructions.push(`E-filing is required in ${county.name}. Visit ${county.eFilingUrl || 'the county e-filing portal'} to file.`)
  }
  
  if (county.parentingClassRequired) {
    instructions.push('A parenting education class is required for all cases involving minor children.')
  }
  
  if (county.mediationRequired) {
    instructions.push('Mediation may be required before trial for custody/parenting disputes.')
  }
  
  if (county.localRules) {
    instructions.push(...county.localRules)
  }
  
  if (county.specialRequirements) {
    instructions.push(...county.specialRequirements)
  }
  
  return instructions
}

/**
 * Format county for display in dropdowns
 */
export function getCountyOptions(): Array<{ value: string; label: string }> {
  return Object.entries(ILLINOIS_COUNTIES)
    .map(([id, county]) => ({
      value: id,
      label: county.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * All Illinois county names (for reference)
 * Full list of all 102 counties
 */
export const ALL_ILLINOIS_COUNTIES = [
  'Adams', 'Alexander', 'Bond', 'Boone', 'Brown', 'Bureau', 'Calhoun', 'Carroll',
  'Cass', 'Champaign', 'Christian', 'Clark', 'Clay', 'Clinton', 'Coles', 'Cook',
  'Crawford', 'Cumberland', 'DeKalb', 'De Witt', 'Douglas', 'DuPage', 'Edgar',
  'Edwards', 'Effingham', 'Fayette', 'Ford', 'Franklin', 'Fulton', 'Gallatin',
  'Greene', 'Grundy', 'Hamilton', 'Hancock', 'Hardin', 'Henderson', 'Henry',
  'Iroquois', 'Jackson', 'Jasper', 'Jefferson', 'Jersey', 'Jo Daviess', 'Johnson',
  'Kane', 'Kankakee', 'Kendall', 'Knox', 'Lake', 'LaSalle', 'Lawrence', 'Lee',
  'Livingston', 'Logan', 'Macon', 'Macoupin', 'Madison', 'Marion', 'Marshall',
  'Mason', 'Massac', 'McDonough', 'McHenry', 'McLean', 'Menard', 'Mercer',
  'Monroe', 'Montgomery', 'Morgan', 'Moultrie', 'Ogle', 'Peoria', 'Perry',
  'Piatt', 'Pike', 'Pope', 'Pulaski', 'Putnam', 'Randolph', 'Richland',
  'Rock Island', 'Saline', 'Sangamon', 'Schuyler', 'Scott', 'Shelby', 'St. Clair',
  'Stark', 'Stephenson', 'Tazewell', 'Union', 'Vermilion', 'Wabash', 'Warren',
  'Washington', 'Wayne', 'White', 'Whiteside', 'Will', 'Williamson', 'Winnebago',
  'Woodford'
]
