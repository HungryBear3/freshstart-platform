"use client"

import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, ArrowLeft, Search, FileText, HelpCircle } from "lucide-react"

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
              <Search className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-600 text-lg">
              Sorry, we couldn't find the page you're looking for. 
              It may have been moved or doesn't exist.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>

          {/* Helpful Links */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Looking for something specific?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <Link 
                  href="/legal-info" 
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Legal Information</span>
                </Link>
                <Link 
                  href="/questionnaires" 
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Questionnaires</span>
                </Link>
                <Link 
                  href="/legal-info/faq" 
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">FAQ</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <p className="mt-8 text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact our support team</Link>
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
