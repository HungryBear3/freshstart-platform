import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function DisclaimerPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="bg-white">
          <header className="mb-10 pb-6 border-b border-gray-200">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Legal Disclaimer
            </h1>
          </header>

          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-900 font-bold text-lg mb-2">
              Important: Not Legal Advice
            </AlertTitle>
            <AlertDescription className="text-red-800">
              FreshStart IL provides legal information only, not legal advice. We are not a law firm and do not provide legal representation. You should consult with a licensed attorney for legal advice specific to your situation.
            </AlertDescription>
          </Alert>

          <Card className="shadow-sm border-gray-200 mb-8">
            <CardContent className="py-10 px-6 sm:px-10">
              <div className="article-content space-y-6">
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">No Attorney-Client Relationship</h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Use of FreshStart IL's website, tools, and services does not create an attorney-client relationship between you and FreshStart IL. We are not a law firm, and no attorney-client relationship is formed by accessing or using our Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Not Legal Advice</h2>
                  <p>The information provided through FreshStart IL is for informational and educational purposes only. It is not legal advice and should not be construed as such. Legal advice is the application of law to your specific circumstances, which requires:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Understanding of your complete factual situation</li>
                    <li>Knowledge of current Illinois law</li>
                    <li>Professional judgment and analysis</li>
                    <li>An attorney-client relationship with confidentiality protections</li>
                  </ul>
                  <p className="mt-4"><strong>You should consult with a licensed Illinois attorney for legal advice specific to your divorce case.</strong></p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Information Accuracy</h2>
                  <p>While we make efforts to ensure the accuracy of information provided through our Service, we cannot guarantee that all information is:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Current or up-to-date (laws and procedures change)</li>
                    <li>Complete (we cannot cover every possible scenario)</li>
                    <li>Applicable to your specific situation</li>
                    <li>Error-free</li>
                  </ul>
                  <p className="mt-4">Illinois divorce law is complex and subject to interpretation. Court procedures may vary by county. You should verify important information with an attorney or official court resources.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Document Generation</h2>
                  <p>Documents generated through our Service are based on:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Information you provide through questionnaires</li>
                    <li>Standard Illinois court forms and templates</li>
                    <li>General practices and procedures</li>
                  </ul>
                  <p className="mt-4"><strong>Important Limitations:</strong></p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Generated documents may not be appropriate for your specific circumstances</li>
                    <li>Documents should be reviewed by an attorney before filing</li>
                    <li>We are not responsible for errors, omissions, or formatting issues</li>
                    <li>Court requirements may vary by county</li>
                    <li>Laws and forms may have changed since documents were generated</li>
                  </ul>
                  <p className="mt-4">You are responsible for ensuring that all documents are accurate, complete, and appropriate for your case before filing them with the court.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Calculators and Estimates</h2>
                  <p>Our calculators (timeline, cost, child support, spousal maintenance) provide estimates based on:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Illinois statutory guidelines and formulas</li>
                    <li>General practices and averages</li>
                    <li>Information you provide</li>
                  </ul>
                  <p className="mt-4"><strong>These are estimates only.</strong> Actual court orders, timelines, and costs may vary significantly based on:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Your specific circumstances</li>
                    <li>Judicial discretion</li>
                    <li>County-specific procedures</li>
                    <li>Complexity of your case</li>
                    <li>Negotiations between parties</li>
                    <li>Changes in law or procedures</li>
                  </ul>
                  <p className="mt-4">You should not rely solely on our calculators when making important decisions. Consult with an attorney for advice on your specific situation.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Complex Cases</h2>
                  <p>Our Service is designed for straightforward divorce cases. You should consult with an attorney if your case involves:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>High-value assets or complex property division</li>
                    <li>Disputes over child custody or parenting time</li>
                    <li>Domestic violence or safety concerns</li>
                    <li>Business interests or complex financial situations</li>
                    <li>International or interstate complications</li>
                    <li>Disputes requiring litigation or court hearings</li>
                    <li>Complex tax implications</li>
                    <li>Prenuptial or postnuptial agreements</li>
                    <li>Substantial debts or financial complications</li>
                  </ul>
                  <p className="mt-4">An attorney can help you navigate complex situations and protect your interests.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">County-Specific Variations</h2>
                  <p>While most Illinois divorce procedures are statewide, some requirements and procedures vary by county or judicial circuit, including:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Filing fees and payment methods</li>
                    <li>Required forms and documents</li>
                    <li>E-filing procedures and requirements</li>
                    <li>Parent education program requirements</li>
                    <li>Local court rules and procedures</li>
                    <li>Hearing and trial scheduling</li>
                  </ul>
                  <p className="mt-4">We try to note county-specific variations where applicable, but you should verify requirements with your specific court or circuit clerk's office.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">No Guarantees</h2>
                  <p>We make no guarantees, warranties, or representations regarding:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>The outcome of your divorce case</li>
                    <li>The accuracy or completeness of information provided</li>
                    <li>The suitability of generated documents for your case</li>
                    <li>Timelines, costs, or other estimates</li>
                    <li>That using our Service will result in a favorable outcome</li>
                    <li>That documents will be accepted by the court</li>
                  </ul>
                  <p className="mt-4">Every divorce case is unique, and outcomes depend on many factors beyond the scope of our Service.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">When to Consult an Attorney</h2>
                  <p>You should consult with a licensed Illinois attorney if:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>You have questions about your legal rights or obligations</li>
                    <li>Your case involves complex issues (as listed above)</li>
                    <li>You and your spouse disagree on important issues</li>
                    <li>You need representation in court</li>
                    <li>You want legal advice specific to your situation</li>
                    <li>You're unsure whether to proceed pro se or with an attorney</li>
                    <li>Your spouse has an attorney and you don't</li>
                  </ul>
                  <p className="mt-4">Many people use our Service to prepare and understand the process before consulting with an attorney, which can make the consultation more productive and cost-effective.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Limitation of Liability</h2>
                  <p>To the maximum extent permitted by law, FreshStart IL shall not be liable for any damages arising from:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Your use or inability to use our Service</li>
                    <li>Errors or omissions in information provided</li>
                    <li>Errors in generated documents</li>
                    <li>Delays or problems in the divorce process</li>
                    <li>Court rejection of documents</li>
                    <li>Decisions made based on information from our Service</li>
                    <li>Any indirect, incidental, or consequential damages</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Unauthorized Practice of Law</h2>
                  <p>FreshStart IL is careful to provide information and tools, not legal advice. We do not:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Represent clients in legal matters</li>
                    <li>Give legal advice about specific cases</li>
                    <li>Interpret laws as they apply to specific situations</li>
                    <li>Engage in the unauthorized practice of law</li>
                  </ul>
                  <p className="mt-4">If you believe we have crossed the line into legal advice, please contact us immediately.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Your Responsibility</h2>
                  <p>You are responsible for:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Ensuring the accuracy of all information you provide</li>
                    <li>Reviewing all generated documents carefully</li>
                    <li>Verifying that documents meet court requirements</li>
                    <li>Filing documents correctly and on time</li>
                    <li>Understanding and following Illinois divorce laws and procedures</li>
                    <li>Consulting with an attorney when appropriate</li>
                    <li>Making informed decisions about your divorce case</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
                  <p>If you have questions about this disclaimer or our Service, please contact us:</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Email:</strong> support@freshstart-il.com</p>
                    <p className="mt-2"><strong>Website:</strong> www.freshstart-il.com</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Remember</h3>
              <p className="text-blue-800">
                FreshStart IL is a tool to help you understand and navigate the divorce process. It is not a substitute for professional legal advice. When in doubt, consult with a licensed Illinois attorney.
              </p>
            </CardContent>
          </Card>
        </article>
      </div>
    </MainLayout>
  )
}
