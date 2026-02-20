import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscribeButton } from "@/components/stripe/subscribe-button"
import { AutoSubscribe } from "@/components/stripe/auto-subscribe"
import {
  FileText,
  Calendar,
  Calculator,
  CheckCircle2,
  HelpCircle,
  Shield,
  Clock,
  BookOpen,
  MessageSquare,
  Users,
  Baby,
} from "lucide-react"

export default function PricingPage() {
  const features = [
    {
      icon: FileText,
      title: "All court forms filled out correctly",
      description: "All required Illinois divorce forms automatically filled out with your information. Edit and regenerate when your info changes.",
    },
    {
      icon: Calendar,
      title: "Step-by-step roadmap",
      description: "Personalized guidance for your specific situation: filing or responding, with or without kids",
    },
    {
      icon: Baby,
      title: "Children's information management",
      description: "Track and manage your children's information including schools, doctors, addresses, and timeline history",
    },
    {
      icon: Users,
      title: "Parenting plan builder with joint custody support",
      description: "Create comprehensive parenting plans with 50/50, joint custody, and custom arrangements. Visual calendar view included",
    },
    {
      icon: Calendar,
      title: "Interactive parenting schedule calendar",
      description: "Visual calendar showing parenting time, holidays, school breaks, and summer vacation schedules with color-coded parent assignments",
    },
    {
      icon: Shield,
      title: "E-filing support",
      description: "Help with electronic filing through Illinois E-Services and county-specific requirements",
    },
    {
      icon: Calculator,
      title: "Financial calculators",
      description: "Calculate child support and spousal maintenance using Illinois statutory guidelines",
    },
    {
      icon: BookOpen,
      title: "Legal information library",
      description: "Access comprehensive guides, glossaries, and Illinois-specific legal resources",
    },
    {
      icon: FileText,
      title: "Prenup and postnup support",
      description: "Specialized guidance and document handling for couples with prenuptial or postnuptial agreements",
    },
    {
      icon: Clock,
      title: "Case timeline tracking",
      description: "Track deadlines, court dates, and milestones. Email reminders at 7, 3, and 1 days before due dates. Auto-generate Illinois deadlines from your filing date.",
    },
  ]

  // Features coming soon (after AI chatbot implementation)
  const comingSoonFeatures = [
    {
      icon: MessageSquare,
      title: "24/7 AI legal guidance",
      description: "Get instant answers to your Illinois divorce questions, anytime you need help",
      comingSoon: true,
    },
    {
      icon: HelpCircle,
      title: "Unlimited questions answered",
      description: "Ask as many questions as you need about Illinois divorce law and your case",
      comingSoon: true,
    },
  ]

  const faqs = [
    {
      question: "Do I need a lawyer to use FreshStart IL?",
      answer:
        "FreshStart IL is perfect for people representing themselves (pro se) or those with an attorney who want to save money. Our platform guides you through every step, whether you're going it alone or working with a lawyer.",
    },
    {
      question: "What if my spouse and I disagree on things?",
      answer:
        "FreshStart IL includes tools and guidance to help you work through disagreements and find fair solutions. For complex disputes, we recommend consulting with a mediator or attorney.",
    },
    {
      question: "Will my forms be accepted by the court?",
      answer:
        "Yes. We automatically fill all required Illinois divorce form fields correctly, following current court rules and Illinois Compiled Statutes. Forms are formatted according to Illinois court requirements.",
    },
    {
      question: "How long does the divorce process take?",
      answer:
        "Illinois requires a 90-day waiting period after filing. Most uncontested divorces are finalized in 3-6 months. FreshStart IL helps you move as quickly as possible by keeping you organized and on track.",
    },
    {
      question: "Can I use FreshStart IL if I have children or complex finances?",
      answer:
        "Absolutely. FreshStart IL handles child custody, support calculations, asset division, and complex financial affidavits. The more complex your case, the more time and money you can save.",
    },
    {
      question: "What happens after my free trial ends?",
      answer:
        "You'll be charged $299/year after your 7-day free trial. You can cancel anytime with one click - no questions asked. We offer a 30-day money-back guarantee if you're not satisfied.",
    },
    {
      question: "Is my information private and secure?",
      answer:
        "Yes. Your data is stored securely with industry-standard encryption in transit and at rest. We never share your information with anyone. Your divorce details are completely confidential.",
    },
    {
      question: "Can I get help if I get stuck?",
      answer:
        "You get access to our platform with comprehensive guides, calculators, and step-by-step instructions. All information is based on Illinois law and court requirements. AI chatbot support is coming soon.",
    },
    {
      question: "Can I use FreshStart IL if I have a prenuptial or postnuptial agreement?",
      answer:
        "Yes! FreshStart IL works for couples with or without prenuptial/postnuptial agreements. If you have an agreement, our platform helps you organize your prenup information, upload your agreement documents, and generate divorce documents that account for your agreement. We provide specialized guidance and resources specifically for navigating divorce with prenups. Learn more in our Prenuptial and Postnuptial Agreements guide.",
    },
    {
      question: "What if FreshStart IL doesn't work for my situation?",
      answer:
        "Try it risk-free for 7 days. If it's not right for you, get a full refund within 30 days - no questions asked. We're confident our platform can help most Illinois divorce cases.",
    },
  ]

  return (
    <MainLayout>
      <AutoSubscribe />
      <div className="bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                One price. Everything included.
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Forms, guidance, case management, and answers—available 24/7. No hourly fees.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center">
            <Card className="w-full max-w-2xl border-2 border-blue-600 shadow-lg">
              <CardHeader className="text-center pb-8">
                <div className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full mb-4">
                  7-Day Free Trial
                </div>
                <CardTitle className="text-5xl font-bold text-gray-900">
                  $299
                  <span className="text-2xl font-normal text-gray-600">/year</span>
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  File your Illinois divorce online. One price. No hourly fees.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{feature.title}</p>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Coming Soon Features */}
                {comingSoonFeatures.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-500 mb-3">Coming Soon:</p>
                    <div className="space-y-4">
                      {comingSoonFeatures.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                          <div key={index} className="flex items-start gap-3 opacity-60">
                            <Icon className="h-6 w-6 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-600">
                                {feature.title}
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Coming Soon
                                </span>
                              </p>
                              <p className="text-sm text-gray-500">{feature.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-200">
                  <SubscribeButton
                    plan="annual"
                    size="lg"
                    className="w-full text-lg py-6"
                  >
                    Start Free Trial
                  </SubscribeButton>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Cancel anytime • 30-day money-back guarantee
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-white border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Learn from people who've been through it.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-700 italic mb-4">
                    "I wish I had used FreshStart IL. It would've saved me at least $5,000."
                  </p>
                  <p className="text-sm font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-sm text-gray-500">Chicago, IL</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-700 italic mb-4">
                    "FreshStart IL could have saved me thousands of dollars and weeks of headaches."
                  </p>
                  <p className="text-sm font-semibold text-gray-900">Michael R.</p>
                  <p className="text-sm text-gray-500">Springfield, IL</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-700 italic mb-4">
                    "FreshStart IL makes it so much easier to fill out complex forms correctly. The step-by-step guidance was exactly what I needed."
                  </p>
                  <p className="text-sm font-semibold text-gray-900">Jennifer L.</p>
                  <p className="text-sm text-gray-500">Naperville, IL</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                If you can't find what you're looking for, email our support team and we'll get back to you within 24 hours.
              </p>
              <Link href="mailto:support@freshstart-il.com">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Start your 7-day free trial today. No credit card required.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="text-lg py-6 px-8">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
