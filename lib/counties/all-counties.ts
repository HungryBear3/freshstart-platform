/**
 * Canonical list of all 102 Illinois counties.
 *
 * Single source of truth for the "available in all 102 counties" availability claim.
 * Names match the canonical Illinois county roster (general knowledge / Illinois
 * Compiled Statutes 55 ILCS 5/ Article 1 county roster). DO NOT modify this list
 * without verifying against an authoritative state source.
 *
 * Conventions:
 * - "DeKalb" is spelled without an internal space (standard Illinois usage).
 * - "De Witt" is spelled with a space — matches the official Census/state
 *   spelling and the detailed-county record in
 *   `lib/counties/illinois-counties.ts`. Older code that used "DeWitt"
 *   (no space) has been normalized to "De Witt".
 * - "Jo Daviess" keeps the space.
 * - "St. Clair" keeps the period.
 * - "Rock Island", "LaSalle", "DuPage", "McDonough", "McHenry", "McLean" follow
 *   the standard Illinois spellings.
 *
 * This file intentionally only exports a flat string array. Per-county detail
 * (filing fees, e-filing portal, judicial circuit) lives in
 * `lib/counties/illinois-counties.ts` under the `ILLINOIS_COUNTIES` record.
 */
export const ALL_ILLINOIS_COUNTIES: readonly string[] = [
  "Adams",
  "Alexander",
  "Bond",
  "Boone",
  "Brown",
  "Bureau",
  "Calhoun",
  "Carroll",
  "Cass",
  "Champaign",
  "Christian",
  "Clark",
  "Clay",
  "Clinton",
  "Coles",
  "Cook",
  "Crawford",
  "Cumberland",
  "DeKalb",
  "De Witt",
  "Douglas",
  "DuPage",
  "Edgar",
  "Edwards",
  "Effingham",
  "Fayette",
  "Ford",
  "Franklin",
  "Fulton",
  "Gallatin",
  "Greene",
  "Grundy",
  "Hamilton",
  "Hancock",
  "Hardin",
  "Henderson",
  "Henry",
  "Iroquois",
  "Jackson",
  "Jasper",
  "Jefferson",
  "Jersey",
  "Jo Daviess",
  "Johnson",
  "Kane",
  "Kankakee",
  "Kendall",
  "Knox",
  "Lake",
  "LaSalle",
  "Lawrence",
  "Lee",
  "Livingston",
  "Logan",
  "Macon",
  "Macoupin",
  "Madison",
  "Marion",
  "Marshall",
  "Mason",
  "Massac",
  "McDonough",
  "McHenry",
  "McLean",
  "Menard",
  "Mercer",
  "Monroe",
  "Montgomery",
  "Morgan",
  "Moultrie",
  "Ogle",
  "Peoria",
  "Perry",
  "Piatt",
  "Pike",
  "Pope",
  "Pulaski",
  "Putnam",
  "Randolph",
  "Richland",
  "Rock Island",
  "Saline",
  "Sangamon",
  "Schuyler",
  "Scott",
  "Shelby",
  "St. Clair",
  "Stark",
  "Stephenson",
  "Tazewell",
  "Union",
  "Vermilion",
  "Wabash",
  "Warren",
  "Washington",
  "Wayne",
  "White",
  "Whiteside",
  "Will",
  "Williamson",
  "Winnebago",
  "Woodford",
] as const

export const ILLINOIS_COUNTY_COUNT = 102 as const
