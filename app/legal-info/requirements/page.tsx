import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Disclaimer } from "@/components/legal/disclaimer"
import { CheckCircle2, XCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RequirementsPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Illinois Divorce Requirements
          </h1>
          <p className="text-lg text-gray-600">
            General information to help you identify requirements to verify before filing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Residency Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Illinois Residency Timing</h3>
                <p className="text-sm text-gray-700">
                  Illinois law includes a 90-day state-residency timing requirement tied to
                  commencement or entry of judgment. The timing can depend on when the court
                  makes the required finding, so verify it for your case before filing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">County Filing</h3>
                <p className="text-sm text-gray-700">
                  County venue is a separate question from the state-residency period. Verify the
                  proper county under current law and local circuit-clerk instructions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Military Exception</h3>
                <p className="text-sm text-gray-700">
                  Special rules may affect military members. Verify current requirements with the
                  circuit clerk or a licensed Illinois attorney.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Grounds for Divorce
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Irreconcilable Differences</h3>
                <p className="text-sm text-gray-700">
                  The most common ground for divorce in Illinois. This is a no-fault ground,
                  meaning you don't need to prove wrongdoing by either spouse.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What It Means</h3>
                <p className="text-sm text-gray-700">
                  The marriage has broken down and cannot be repaired, with no reasonable
                  prospect of reconciliation. Illinois law addresses separation as part of that
                  analysis; do not treat this page as a filing-timing determination.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Separation Period</h3>
                <p className="text-sm text-gray-700">
                  Six months living separate and apart can create a statutory presumption, but
                  application depends on the case. Verify the current rule before relying on it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Petition for Dissolution of Marriage
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  The main document that starts the divorce process. Must include:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                  <li>Grounds for divorce</li>
                  <li>Information about you, your spouse, and any children</li>
                  <li>What you're requesting (custody, support, property division)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Financial Affidavit</h3>
                <p className="text-sm text-gray-700 mb-2">
                  A court or case may require financial disclosure. Confirm whether a Financial
                  Affidavit applies and which current form the court expects:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                  <li>
                    <strong>Short Form:</strong> Use only if current court instructions say it
                    applies
                  </li>
                  <li>
                    <strong>Long Form:</strong> Use only if current court instructions say it
                    applies
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Additional Documents</h3>
                <p className="text-sm text-gray-700 mb-2">
                  May be required depending on your situation:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                  <li>Parenting Plan (if children involved)</li>
                  <li>Marital Settlement Agreement (if uncontested)</li>
                  <li>Proof of service of process</li>
                  <li>Parent education certificate (if required by county)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertTitle>What You DON'T Need</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              <strong>You don't need to prove fault.</strong> Illinois is a no-fault divorce
              state, so you don't need to prove adultery, abandonment, or other wrongdoing.
            </p>
            <p>
              <strong>You don't need your spouse's agreement to file.</strong> You can file
              for divorce even if your spouse doesn't want one.
            </p>
            <p>
              <strong>You don't always need an attorney.</strong> Many people successfully file
              for divorce without an attorney (pro se), especially in uncontested cases.
            </p>
          </AlertDescription>
        </Alert>

        <div className="mt-8">
          <Disclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
