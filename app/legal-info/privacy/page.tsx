import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Disclaimer } from "@/components/legal/disclaimer"

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="bg-white">
          <header className="mb-10 pb-6 border-b border-gray-200">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Privacy Policy
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
                    FreshStart IL ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services located at www.freshstart-il.com (the "Service").
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Information We Collect</h2>
                  
                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Personal Information</h3>
                  <p>We may collect personal information that you voluntarily provide to us when you:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Register for an account (name, email address, password)</li>
                    <li>Use our questionnaires and document generation features</li>
                    <li>Upload documents or financial information</li>
                    <li>Contact us for support or inquiries</li>
                    <li>Subscribe to our newsletter or updates</li>
                  </ul>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Automatically Collected Information</h3>
                  <p>When you visit our Service, we may automatically collect certain information, including:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Operating system information</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Financial and Legal Information</h3>
                  <p>To provide our services, we may collect sensitive information including:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Financial information (income, expenses, assets, debts)</li>
                    <li>Personal information about you, your spouse, and children</li>
                    <li>Legal documents and case information</li>
                    <li>Divorce-related information and circumstances</li>
                  </ul>
                  <p className="mt-4"><strong>Note:</strong> We treat all financial and legal information with the highest level of security and confidentiality.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">How We Use Your Information</h2>
                  <p>We use the information we collect to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Provide, operate, and maintain our Service</li>
                    <li>Generate legal documents and forms based on your input</li>
                    <li>Calculate timelines, costs, child support, and spousal maintenance</li>
                    <li>Send you account-related communications (verification emails, password resets)</li>
                    <li>Respond to your inquiries and provide customer support</li>
                    <li>Send you service updates, newsletters, and marketing communications (with your consent)</li>
                    <li>Monitor and analyze usage patterns and trends</li>
                    <li>Detect, prevent, and address technical issues and fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Information Sharing and Disclosure</h2>
                  <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                  
                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Service Providers</h3>
                  <p>We may share information with third-party service providers who perform services on our behalf, such as:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Hosting and cloud storage providers</li>
                    <li>Email service providers</li>
                    <li>Payment processors (if applicable)</li>
                    <li>Analytics and monitoring services</li>
                  </ul>
                  <p className="mt-4">These service providers are contractually obligated to protect your information and use it only for the purposes we specify.</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Legal Requirements</h3>
                  <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Business Transfers</h3>
                  <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
                  <p>We implement appropriate technical and organizational security measures to protect your personal information, including:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Encryption of data in transit (HTTPS/TLS)</li>
                    <li>Encryption of sensitive data at rest</li>
                    <li>Secure authentication and access controls</li>
                    <li>Regular security assessments and updates</li>
                    <li>Limited access to personal information on a need-to-know basis</li>
                  </ul>
                  <p className="mt-4">
                    However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Your Rights and Choices</h2>
                  <p>Under Illinois law and applicable privacy regulations, you have the right to:</p>
                  
                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Access Your Information</h3>
                  <p>You can access, review, and update your personal information through your account settings or by contacting us.</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Data Portability</h3>
                  <p>You can request a copy of your data in a structured, machine-readable format. Use the "Export Data" feature in your account or contact us.</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Deletion</h3>
                  <p>You can request deletion of your account and personal information at any time. Use the "Delete Account" feature in your account settings or contact us.</p>
                  <p className="mt-2"><strong>Note:</strong> Some information may be retained as required by law or for legitimate business purposes (e.g., legal compliance, dispute resolution).</p>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Opt-Out of Marketing</h3>
                  <p>You can opt-out of marketing communications at any time by:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Clicking the "unsubscribe" link in marketing emails</li>
                    <li>Updating your communication preferences in account settings</li>
                    <li>Contacting us directly</li>
                  </ul>

                  <h3 className="text-2xl font-semibold text-blue-600 mb-3 mt-6">Cookies and Tracking</h3>
                  <p>You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our Service.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Cookies and Tracking Technologies</h2>
                  <p>We use cookies and similar tracking technologies to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Maintain your login session</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze usage patterns and improve our Service</li>
                    <li>Provide personalized content</li>
                  </ul>
                  <p className="mt-4">Types of cookies we use:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for the Service to function properly</li>
                    <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our Service</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Data Retention</h2>
                  <p>We retain your personal information for as long as necessary to:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Provide our services to you</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes and enforce our agreements</li>
                    <li>Support business operations</li>
                  </ul>
                  <p className="mt-4">When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or legitimate business purposes.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Children's Privacy</h2>
                  <p>Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.</p>
                  <p className="mt-4"><strong>Note:</strong> While our Service may collect information about children as part of divorce-related services (e.g., custody arrangements), this information is collected from parents/guardians, not directly from children.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Illinois Privacy Rights</h2>
                  <p>If you are a resident of Illinois, you have additional privacy rights under Illinois law, including:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>The right to know what personal information we collect about you</li>
                    <li>The right to access your personal information</li>
                    <li>The right to request deletion of your personal information</li>
                    <li>The right to opt-out of the sale of personal information (if applicable)</li>
                    <li>The right to non-discrimination for exercising your privacy rights</li>
                  </ul>
                  <p className="mt-4">To exercise these rights, please contact us using the information provided in the "Contact Us" section below.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Third-Party Links</h2>
                  <p>Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Changes to This Privacy Policy</h2>
                  <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
                  <ul className="ml-6 mt-4 space-y-2">
                    <li>Posting the new Privacy Policy on this page</li>
                    <li>Updating the "Last Updated" date</li>
                    <li>Sending you an email notification (for significant changes)</li>
                    <li>Displaying a notice on our Service</li>
                  </ul>
                  <p className="mt-4">Your continued use of our Service after any changes constitutes acceptance of the updated Privacy Policy.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
                  <p>If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Email:</strong> support@freshstart-il.com</p>
                    <p className="mt-2"><strong>Website:</strong> www.freshstart-il.com</p>
                    <p className="mt-2"><strong>Address:</strong> Chicago, IL</p>
                  </div>
                  <p className="mt-4">We will respond to your inquiry within a reasonable timeframe, typically within 30 days.</p>
                </section>

                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Consent</h2>
                  <p>By using our Service, you consent to the collection and use of your information as described in this Privacy Policy.</p>
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
