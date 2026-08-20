/**
 * @jest-environment node
 */
import { parseGaIdentifiersFromCookieHeader } from "@/lib/analytics/ga4-cookies"

describe("GA cookie parsing", () => {
  it("extracts bounded anonymous identifiers from exact measurement cookies", () => {
    expect(parseGaIdentifiersFromCookieHeader(
      "_ga=GA1.1.123456789.987654321; _ga_ABC123XYZ=GS1.1.1724123456.7.1.1724123999.0.0.0",
      "G-ABC123XYZ",
    )).toEqual({
      gaClientId: "123456789.987654321",
      gaSessionId: 1724123456,
      gaSessionNumber: 7,
    })
  })

  it("fails closed on malformed percent encoding", () => {
    expect(parseGaIdentifiersFromCookieHeader(
      "_ga=GA1.1.123.456; _ga_ABC123XYZ=%E0%A4%A",
      "G-ABC123XYZ",
    )).toEqual({})
  })

  it("drops invalid or unbounded session identifiers while preserving a valid client id", () => {
    expect(parseGaIdentifiersFromCookieHeader(
      "_ga=GA1.1.123456789.987654321; _ga_ABC123XYZ=GS1.1.-1.9007199254740992.1.1724123999.0.0.0",
      "G-ABC123XYZ",
    )).toEqual({
      gaClientId: "123456789.987654321",
    })
  })
})
