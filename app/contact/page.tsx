import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Clock, MessageSquare } from "lucide-react"
import { Disclaimer } from "@/components/legal/disclaimer"
import { ContactForm } from "@/components/contact/contact-form"

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions or need help? Fill out the form below or send us an email and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="mb-8">
          <ContactForm />
        </div>

        <Card className="shadow-lg border border-gray-200 bg-gray-50 mb-8">
          <CardHeader className="text-center pb-4">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-gray-900 mb-2">Prefer to Email Directly?</CardTitle>
            <CardDescription className="text-base">
              You can also reach us directly via email
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div>
              <a
                href="mailto:support@freshstart-il.com"
                className="inline-block text-xl font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                support@freshstart-il.com
              </a>
            </div>
            <div>
              <a href="mailto:support@freshstart-il.com">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Open Email Client
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 font-medium">Monday - Friday</p>
              <p className="text-gray-700">9:00 AM - 5:00 PM CT</p>
              <p className="text-sm text-gray-500 mt-3">
                We may respond outside these hours, but typically reply during business days.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 font-medium">Within 2-3 business days</p>
              <p className="text-sm text-gray-500 mt-3">
                For urgent matters, please include "URGENT" in your email subject line.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>What to Include</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                When emailing us, please include:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Detailed description of your question</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
            <CardDescription>
              Before emailing, check out our FAQ page for answers to common questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Many questions are answered in our{" "}
              <a
                href="/legal-info/faq"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Frequently Asked Questions (FAQ)
              </a>{" "}
              page. This can save you time and get you answers faster!
            </p>
            <a href="/legal-info/faq">
              <Button variant="outline">
                View FAQ Page →
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Disclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
