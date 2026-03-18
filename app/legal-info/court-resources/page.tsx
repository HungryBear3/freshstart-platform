import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Disclaimer } from "@/components/legal/disclaimer"
import { ExternalLink, FileText, Globe, Book } from "lucide-react"

export default function CourtResourcesPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Illinois Court Resources
          </h1>
          <p className="text-lg text-gray-600">
            Official Illinois court resources, forms, and helpful links for your divorce
            process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Illinois E-Services</CardTitle>
              <CardDescription>
                Electronic filing system for Illinois courts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                File documents electronically without visiting the courthouse. Most Illinois
                counties accept e-filing.
              </p>
              <a
                href="https://www.illinoiscourts.gov/eservices"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  Visit E-Services <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Illinois Court Forms</CardTitle>
              <CardDescription>
                Official forms for divorce and family law
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Download official Illinois court forms for divorce, custody, and support.
              </p>
              <a
                href="https://www.illinoiscourts.gov/forms"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  View Forms <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Book className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Illinois Compiled Statutes</CardTitle>
              <CardDescription>
                Illinois divorce and family law statutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Read the actual Illinois laws governing divorce, custody, and support.
              </p>
              <a
                href="https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2086&ChapterID=59"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  View Statutes <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Child Support Guidelines</CardTitle>
              <CardDescription>
                Official Illinois child support calculation guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Review the official guidelines used to calculate child support in Illinois.
              </p>
              <a
                href="https://www.illinoiscourts.gov/Resources/68d68b3a-0e5a-4b0a-9f5a-5e5a5e5a5e5a"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  View Guidelines <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Circuit Clerk Offices</CardTitle>
            <CardDescription>
              Contact information for Illinois circuit clerk offices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Circuit clerk offices handle divorce filings and can provide:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
                <li>Filing forms and instructions</li>
                <li>Filing fee information</li>
                <li>Fee waiver applications</li>
                <li>Local court rules and procedures</li>
                <li>E-filing assistance</li>
              </ul>
              <p className="text-sm text-gray-700 mt-4">
                <strong>Find your circuit clerk:</strong> Search for "[Your County] Circuit
                Clerk" or visit the{" "}
                <a
                  href="https://www.illinoiscourts.gov/courts/circuit-court"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Illinois Courts website
                </a>{" "}
                for contact information.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Illinois Legal Aid Organizations
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Free or low-cost legal assistance for qualifying individuals:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                  <li>
                    <a
                      href="https://www.illinoislegalaid.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Illinois Legal Aid Online
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.lawhelpillinois.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Law Help Illinois
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Self-Help Resources</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Resources for people representing themselves:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                  <li>Illinois Courts Self-Help Center</li>
                  <li>Pro Se (Self-Represented) Litigant Resources</li>
                  <li>Court-approved forms and instructions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Disclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
