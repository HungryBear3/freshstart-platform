import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Disclaimer } from "@/components/legal/disclaimer"

export default function TermsOfServicePage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="bg-white">
          <header className="mb-10 pb-6 border-b border-gray-200">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Terms of Service
            </h1>
            <div className="text-sm text-gray-500">
              <p>Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </header>

          <Card className="shadow-sm border-gray-200 mb-8">
            <CardContent className="py-10 px-6 sm:px-10">
              <div className="article-content space-y-6">
                <section>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    These Terms of Service ("Terms") govern your access to and use of FreshStart IL's website and services located at www.freshstart-il.com (the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Acceptance of Terms</h2>
                  <p>By accessing or using our Service, you agree to comply with and be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Eligibility</h2>
                  <p>You must be at least 18 years old to use our Service. By using the Service, you represent and warrant that:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>You are at least 18 years of age</li>
                    <li>You have the legal capacity to enter into these Terms</li>
                    <li>You are a resident of Illinois or using the Service for an Illinois divorce case</li>
                    <li>You will comply with all applicable laws and regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Description of Service</h2>
                  <p>FreshStart IL provides informational resources and tools to help Illinois residents navigate the divorce process. Our Service includes:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Legal information articles and guides</li>
                    <li>Calculators (timeline, cost, child support, spousal maintenance)</li>
                    <li>Document generation tools and questionnaires</li>
                    <li>Case management and tracking features</li>
                    <li>Educational resources about Illinois divorce law</li>
                  </ul>
                  <p className="mt-4"><strong>Important:</strong> Our Service provides legal information only, not legal advice. We are not a law firm and do not provide legal representation.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Not Legal Advice</h2>
                  <p><strong>Our Service Does Not Constitute Legal Advice.</strong> The information, tools, and resources provided through our Service are for informational and educational purposes only. They do not constitute legal advice, legal representation, or an attorney-client relationship.</p>
                  <p className="mt-4">You acknowledge and agree that:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>FreshStart IL is not a law firm and does not provide legal services</li>
                    <li>No attorney-client relationship is formed by using our Service</li>
                    <li>The information provided is general in nature and may not apply to your specific situation</li>
                    <li>You should consult with a licensed attorney for advice on your specific legal situation</li>
                    <li>We are not responsible for the accuracy, completeness, or timeliness of the information provided</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">User Accounts and Responsibilities</h2>
                  
                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Account Creation</h3>
                  <p>To use certain features of our Service, you may need to create an account. When creating an account, you agree to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">User Conduct</h3>
                  <p>You agree not to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Use the Service for any illegal or unauthorized purpose</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon the rights of others</li>
                    <li>Transmit any viruses, malware, or harmful code</li>
                    <li>Attempt to gain unauthorized access to the Service or related systems</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Use automated systems to access the Service without permission</li>
                    <li>Impersonate any person or entity</li>
                    <li>Provide false or misleading information</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Intellectual Property</h2>
                  <p>The Service, including all content, features, functionality, and design, is owned by FreshStart IL and protected by United States and international copyright, trademark, and other intellectual property laws.</p>
                  <p className="mt-4">You are granted a limited, non-exclusive, non-transferable, revocable license to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Access and use the Service for personal, non-commercial purposes</li>
                    <li>Generate documents for your personal use in your divorce case</li>
                    <li>Download and print legal information for personal reference</li>
                  </ul>
                  <p className="mt-4">You may not:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Reproduce, distribute, modify, or create derivative works of the Service</li>
                    <li>Use the Service for commercial purposes without permission</li>
                    <li>Remove or alter any copyright, trademark, or proprietary notices</li>
                    <li>Reverse engineer or attempt to extract source code</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">User-Generated Content</h2>
                  <p>You retain ownership of any information, data, or content you submit to our Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Use, store, and process User Content to provide the Service</li>
                    <li>Generate documents and forms based on your User Content</li>
                    <li>Improve and enhance our Service</li>
                  </ul>
                  <p className="mt-4">You represent and warrant that your User Content:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Does not violate any third-party rights</li>
                    <li>Does not contain false or misleading information</li>
                    <li>Complies with all applicable laws and regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Pricing and Payment</h2>
                  <p>Certain features of our Service may be available only through paid subscriptions or one-time payments. If you choose to purchase access to premium features:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>You agree to pay all fees associated with your purchase</li>
                    <li>Fees are non-refundable except as required by law or as stated in our refund policy</li>
                    <li>We reserve the right to change our pricing at any time, with notice to existing subscribers</li>
                    <li>You are responsible for all taxes applicable to your purchase</li>
                    <li>Payment processing is handled by third-party payment processors</li>
                  </ul>
                  <p className="mt-4"><strong>Current Status:</strong> At this time, FreshStart IL is free to use. We reserve the right to introduce paid features or subscriptions in the future with appropriate notice.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Disclaimers and Limitations</h2>
                  
                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Service Availability</h3>
                  <p>We strive to provide reliable service, but we do not guarantee that the Service will be available at all times, uninterrupted, or error-free. The Service is provided "as is" and "as available."</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Information Accuracy</h3>
                  <p>While we make efforts to ensure the accuracy of information provided through our Service, we cannot guarantee that all information is current, complete, or error-free. Laws and court procedures may change, and information may become outdated.</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Limitation of Liability</h3>
                  <p>To the maximum extent permitted by law, FreshStart IL, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Errors or omissions in generated documents</li>
                    <li>Delays or failures in the divorce process</li>
                    <li>Any damages resulting from use or inability to use the Service</li>
                  </ul>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">No Warranties</h3>
                  <p>The Service is provided without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Indemnification</h2>
                  <p>You agree to indemnify, defend, and hold harmless FreshStart IL and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Your use or misuse of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party rights</li>
                    <li>Any User Content you submit</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Termination</h2>
                  <p>We reserve the right to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Suspend or terminate your access to the Service at any time, with or without cause</li>
                    <li>Delete your account and User Content if you violate these Terms</li>
                    <li>Modify or discontinue the Service at any time</li>
                  </ul>
                  <p className="mt-4">You may terminate your account at any time by using the account deletion feature in your account settings or by contacting us.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Governing Law and Dispute Resolution</h2>
                  
                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Governing Law</h3>
                  <p>These Terms shall be governed by and construed in accordance with the laws of the State of Illinois, without regard to its conflict of law provisions.</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Jurisdiction</h3>
                  <p>Any legal action or proceeding arising under these Terms will be brought exclusively in the federal or state courts located in Illinois, and you hereby consent to the personal jurisdiction and venue of such courts.</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Dispute Resolution</h3>
                  <p>Before filing a claim, you agree to try to resolve the dispute informally by contacting us at support@freshstart-il.com. If we cannot resolve the dispute within 30 days, you may file a claim in court.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Changes to Terms</h2>
                  <p>We reserve the right to modify these Terms at any time. We will notify you of material changes by:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Posting the updated Terms on this page</li>
                    <li>Updating the "Last Updated" date</li>
                    <li>Sending you an email notification (for significant changes)</li>
                    <li>Displaying a notice on our Service</li>
                  </ul>
                  <p className="mt-4">Your continued use of the Service after any changes constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Severability</h2>
                  <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Entire Agreement</h2>
                  <p>These Terms, together with our Privacy Policy and any other legal notices published on our Service, constitute the entire agreement between you and FreshStart IL regarding your use of the Service.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
                  <p>If you have questions about these Terms, please contact us:</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Email:</strong> support@freshstart-il.com</p>
                    <p className="mt-2"><strong>Website:</strong> www.freshstart-il.com</p>
                    <p className="mt-2"><strong>Address:</strong> Chicago, IL</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Disclaimer />
          </div>
        </article>
      </div>
    </MainLayout>
  )
}
