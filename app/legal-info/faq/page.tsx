import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Disclaimer } from "@/components/legal/disclaimer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const faqCategories = [
  {
    category: "General",
    questions: [
      {
        question: "What is FreshStart IL?",
        answer: "FreshStart IL is a web platform designed to guide Illinois residents through the divorce process. We provide legal information, calculators, document generation tools, and step-by-step guidance to help you navigate your divorce independently or with better understanding while working with an attorney.",
      },
      {
        question: "Is FreshStart IL a law firm?",
        answer: "No, FreshStart IL is not a law firm. We do not provide legal advice or legal representation. We provide informational resources and tools to help you understand the divorce process in Illinois. You should consult with a licensed attorney for legal advice specific to your situation.",
      },
      {
        question: "Do I need an attorney to use FreshStart IL?",
        answer: "No, you can use FreshStart IL whether you're filing pro se (without an attorney) or working with an attorney. Many people use our platform to better understand the process and prepare documents before consulting with an attorney. However, we recommend consulting with an attorney for complex cases or if you have questions about your specific situation.",
      },
      {
        question: "Who can use FreshStart IL?",
        answer: "FreshStart IL is designed for Illinois residents who are considering or going through divorce. You must be at least 18 years old to use the Service. The platform is specifically tailored for Illinois divorce law and procedures.",
      },
      {
        question: "Is the service free?",
        answer: "Currently, FreshStart IL is free to use. We reserve the right to introduce paid features or subscriptions in the future. If we do, we will provide advance notice and existing users will have the option to continue with free basic features or upgrade to premium features.",
      },
    ],
  },
  {
    category: "How It Works",
    questions: [
      {
        question: "How does the document generation work?",
        answer: "Our document generation system uses guided questionnaires to collect information about your situation. Based on your answers, we automatically populate Illinois court forms and documents. You can review and edit the generated documents before downloading them. The system handles all the complex formatting and field mapping required by Illinois courts.",
      },
      {
        question: "What documents can I generate?",
        answer: "You can generate various Illinois divorce documents including: Petition for Dissolution of Marriage, Financial Affidavits (short and long form), Parenting Plans, and other court-required forms. The specific documents available depend on your situation and needs.",
      },
      {
        question: "Are the calculators accurate?",
        answer: "Our calculators (timeline, cost, child support, spousal maintenance) are based on Illinois statutory guidelines and official formulas. However, these are estimates only. Actual court orders may vary based on specific circumstances and judicial discretion. We provide disclaimers with all calculations.",
      },
      {
        question: "Can I save my progress?",
        answer: "Yes, when you create an account, you can save your progress on questionnaires, track your case information, and return to complete documents at any time. Your information is securely stored and you can access it from any device.",
      },
      {
        question: "Can I edit documents after they're generated?",
        answer: "Yes, you can review and edit generated documents before downloading them. You can also regenerate documents if your information changes. We recommend reviewing all documents carefully to ensure accuracy.",
      },
    ],
  },
  {
    category: "Legal Information",
    questions: [
      {
        question: "Is the legal information on the site accurate?",
        answer: "We make every effort to ensure the legal information on our platform is accurate and up-to-date. However, laws and procedures may change, and information may become outdated. We recommend verifying important information with an attorney or official court resources, especially if laws have changed recently.",
      },
      {
        question: "Does FreshStart IL keep information updated?",
        answer: "We strive to keep our legal information current and update it as Illinois laws and procedures change. However, we cannot guarantee that all information is current at all times. It's always a good idea to consult with an attorney or check official court resources for the most current information.",
      },
      {
        question: "Can I use the information for any Illinois county?",
        answer: "Most of our information applies statewide. However, some procedures and requirements may vary by county or judicial circuit. We try to note county-specific variations where applicable, but you should verify requirements with your specific court.",
      },
    ],
  },
  {
    category: "Prenuptial and Postnuptial Agreements",
    questions: [
      {
        question: "Can I use FreshStart IL if I have a prenuptial or postnuptial agreement?",
        answer: "Yes! FreshStart IL works for couples with or without prenuptial/postnuptial agreements. Our platform is designed to help you navigate divorce whether you have an agreement or not. If you have a prenup or postnup, we provide specialized tools to help you organize your agreement information, upload your documents, and generate divorce paperwork that accounts for your agreement.",
      },
      {
        question: "What if my spouse and I disagree about our prenup?",
        answer: "If you and your spouse disagree about your prenuptial or postnuptial agreement, FreshStart IL can help you organize your information and understand your options. However, disputes about prenup enforcement typically require legal advice. We recommend consulting with an Illinois family law attorney if there's disagreement about your agreement. Our platform can help you prepare for that conversation by organizing your documents and information.",
      },
      {
        question: "Does FreshStart IL decide if my prenup is valid or enforceable?",
        answer: "No. FreshStart IL does not provide legal advice or decide whether your prenuptial or postnuptial agreement is valid, enforceable, or fair. Only a judge or attorney can make those determinations. We help you organize your agreement information and generate documents, but we cannot tell you whether to follow, modify, or challenge your agreement. You should consult with an Illinois family law attorney for advice about your specific agreement.",
      },
      {
        question: "How does FreshStart IL handle prenup information in documents?",
        answer: "If you have a prenuptial or postnuptial agreement, our questionnaires will ask about it and help you summarize key terms. When generating documents like the Marital Settlement Agreement, we'll include references to your agreement and account for any property or financial arrangements specified in it. You can also upload your agreement documents to keep everything organized in one place.",
      },
    ],
  },
  {
    category: "Data Security & Privacy",
    questions: [
      {
        question: "Is my information secure?",
        answer: "Yes, we take data security seriously. We use encryption for data in transit (HTTPS/TLS) and at rest, secure authentication, and follow industry best practices for protecting your personal and financial information. However, no system is 100% secure, so we cannot guarantee absolute security.",
      },
      {
        question: "What information do you collect?",
        answer: "We collect information you provide to us (name, email, divorce-related information), information automatically collected when you use the Service (IP address, browser type, pages visited), and any information you enter into our questionnaires or upload. See our Privacy Policy for complete details.",
      },
      {
        question: "Do you share my information with anyone?",
        answer: "We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who help us operate the Service (hosting, email services), and we may disclose information if required by law. See our Privacy Policy for complete details.",
      },
      {
        question: "Can I delete my account and data?",
        answer: "Yes, you can delete your account and request deletion of your personal information at any time through your account settings or by contacting us. Some information may be retained as required by law or for legitimate business purposes.",
      },
      {
        question: "How long do you keep my information?",
        answer: "We retain your information for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and support business operations. When you delete your account, we delete or anonymize your personal information except where required to retain it.",
      },
    ],
  },
  {
    category: "Support & Help",
    questions: [
      {
        question: "How can I get help or support?",
        answer: "You can contact us at support@freshstart-il.com with any questions or concerns. We aim to respond within a reasonable timeframe, typically within 2-3 business days. You can also check our FAQ and help resources for answers to common questions.",
      },
      {
        question: "What if I find an error in the information?",
        answer: "If you find what you believe is an error in our legal information or calculations, please contact us at support@freshstart-il.com with details. We take accuracy seriously and will review and correct any verified errors.",
      },
      {
        question: "Can I provide feedback?",
        answer: "Yes! We welcome your feedback. Please contact us at support@freshstart-il.com or use any feedback forms on the platform. Your feedback helps us improve the Service.",
      },
      {
        question: "Do you offer refunds?",
        answer: "Currently, FreshStart IL is free to use. If we introduce paid features in the future, we will have a clear refund policy. Generally, fees for completed services (like document generation) are non-refundable, but we may offer refunds for subscription services under certain circumstances as required by law.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          </div>
          <p className="text-lg text-gray-600">
            Find answers to common questions about FreshStart IL and how we can help you navigate your Illinois divorce.
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="shadow-sm border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{category.category}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem key={index} value={`item-${categoryIndex}-${index}`} className="border-b border-gray-200">
                      <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-blue-600 py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 leading-relaxed pt-2 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 shadow-sm border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Still have questions?</h2>
            <p className="text-gray-700 mb-4">
              If you can't find the answer you're looking for, please don't hesitate to contact us. We're here to help!
            </p>
            <a
              href="mailto:support@freshstart-il.com"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Contact Support →
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
