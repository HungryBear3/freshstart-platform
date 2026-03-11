"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, ExternalLink, Info, CheckCircle2, XCircle } from "lucide-react"

const ILLINOIS_COUNTIES = [
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
  "DeWitt",
  "Douglas",
  "DuPage",
  "Edgar",
  "Edwards",
  "Effingham",
  "Fayette",
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
]

// Sample county data - in production, this would come from the database
const SAMPLE_COUNTY_DATA: Record<string, any> = {
  Cook: {
    eFilingAvailable: true,
    eFilingRequired: true,
    portalUrl: "https://efile.illinoiscourts.gov/",
    instructions:
      "Cook County requires e-filing for most documents. All documents must be e-filed through Illinois E-Services. Physical filing is only accepted in limited circumstances.",
    specialRequirements:
      "Cook County has specific formatting requirements. Check the Cook County Circuit Court website for detailed guidelines.",
    contactInfo: {
      phone: "(312) 603-5030",
      email: "efiling@cookcountyil.gov",
      address: "Richard J. Daley Center, 50 W. Washington St., Chicago, IL 60602",
    },
  },
  DuPage: {
    eFilingAvailable: true,
    eFilingRequired: false,
    portalUrl: "https://efile.illinoiscourts.gov/",
    instructions:
      "DuPage County accepts e-filing for most documents. E-filing is encouraged but not required for all document types.",
    specialRequirements:
      "Some document types may require physical filing. Check with the clerk's office for specific requirements.",
    contactInfo: {
      phone: "(630) 407-2000",
      email: "clerk@dupageco.org",
      address: "505 N. County Farm Road, Wheaton, IL 60187",
    },
  },
  Lake: {
    eFilingAvailable: true,
    eFilingRequired: false,
    portalUrl: "https://efile.illinoiscourts.gov/",
    instructions:
      "Lake County accepts e-filing for most documents. E-filing is available and encouraged.",
    specialRequirements: "Standard Illinois E-Services requirements apply.",
    contactInfo: {
      phone: "(847) 377-3600",
      email: "clerk@lakecountyil.gov",
      address: "18 N. County Street, Waukegan, IL 60085",
    },
  },
  Will: {
    eFilingAvailable: true,
    eFilingRequired: false,
    portalUrl: "https://efile.illinoiscourts.gov/",
    instructions:
      "Will County accepts e-filing for most documents. Check specific requirements for your case type.",
    specialRequirements: "Some emergency filings may require in-person submission.",
    contactInfo: {
      phone: "(815) 740-4615",
      email: "clerk@willcountyillinois.com",
      address: "14 W. Jefferson Street, Joliet, IL 60431",
    },
  },
}

export function CountyInstructions() {
  const [selectedCounty, setSelectedCounty] = useState("")
  const [countyData, setCountyData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedCounty) {
      setLoading(true)
      // In production, this would fetch from the API
      // For now, use sample data
      const data = SAMPLE_COUNTY_DATA[selectedCounty]
      if (data) {
        setCountyData(data)
      } else {
        // Default data for counties without specific info
        setCountyData({
          eFilingAvailable: true,
          eFilingRequired: false,
          portalUrl: "https://efile.illinoiscourts.gov/",
          instructions:
            "This county accepts e-filing through Illinois E-Services. Check with the clerk's office for specific requirements.",
          specialRequirements: "Standard Illinois E-Services requirements apply.",
          contactInfo: null,
        })
      }
      setLoading(false)
    } else {
      setCountyData(null)
    }
  }, [selectedCounty])

  return (
    <Card>
      <CardHeader>
        <CardTitle>County-Specific E-Filing Instructions</CardTitle>
        <CardDescription>
          Get specific e-filing information for your county
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="county">Select Your County</Label>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a county" />
              </SelectTrigger>
              <SelectContent>
                {ILLINOIS_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county} County
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-500">Loading county information...</div>
          )}

          {!loading && countyData && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedCounty} County</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        {countyData.eFilingAvailable ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">E-Filing Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-gray-700">E-Filing Not Available</span>
                          </>
                        )}
                      </div>
                      {countyData.eFilingRequired && (
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">
                            E-Filing Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">E-Filing Instructions</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {countyData.instructions}
                </p>
              </div>

              {countyData.specialRequirements && (
                <div>
                  <h4 className="font-semibold mb-2">Special Requirements</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {countyData.specialRequirements}
                  </p>
                </div>
              )}

              {countyData.portalUrl && (
                <div>
                  <h4 className="font-semibold mb-2">E-Filing Portal</h4>
                  <a
                    href={countyData.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Access Illinois E-Services Portal
                  </a>
                </div>
              )}

              {countyData.contactInfo && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Clerk's Office Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {countyData.contactInfo.phone && (
                      <div>
                        <span className="font-medium">Phone: </span>
                        <a
                          href={`tel:${countyData.contactInfo.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {countyData.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {countyData.contactInfo.email && (
                      <div>
                        <span className="font-medium">Email: </span>
                        <a
                          href={`mailto:${countyData.contactInfo.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {countyData.contactInfo.email}
                        </a>
                      </div>
                    )}
                    {countyData.contactInfo.address && (
                      <div>
                        <span className="font-medium">Address: </span>
                        <span className="text-gray-700">{countyData.contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> County requirements may change. Always verify current
                  requirements with the clerk's office before filing. This information is provided
                  as a guide and may not reflect the most current requirements.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!selectedCounty && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a county above to view specific e-filing instructions and requirements for
                that county.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
