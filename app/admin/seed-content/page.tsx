"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SimpleLayout } from "@/components/layouts/simple-layout"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function SeedContentPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/seed-legal-content", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, message: data.error || "Failed to seed content" })
        return
      }

      setResult({ success: true, message: data.message || "Content seeded successfully!" })
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while seeding content",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SimpleLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Seed Legal Content
          </h1>
          <p className="text-lg text-gray-600">
            Add sample legal content articles to the database for testing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Content Seeding</CardTitle>
            <CardDescription>
              This will add sample legal content articles including:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
              <li>Grounds for Divorce in Illinois</li>
              <li>Property Division in Illinois Divorce</li>
              <li>Child Custody and Parenting Time</li>
              <li>Spousal Maintenance (Alimony)</li>
              <li>Residency Requirements</li>
            </ul>

            {result && (
              <Alert className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle className={result.success ? "text-green-800" : "text-red-800"}>
                  {result.success ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription className={result.success ? "text-green-700" : "text-red-700"}>
                  {result.message}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSeed} disabled={loading} className="w-full">
              {loading ? "Seeding Content..." : "Seed Legal Content"}
            </Button>

            <p className="text-xs text-gray-500">
              Note: This will only add content that doesn't already exist (based on slug).
              Existing content will be skipped.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Other Admin Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Create a test user account:
                </p>
                <Link
                  href="/admin/seed-test-user"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Create Test User →
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Seed sample questionnaires:
                </p>
                <Link
                  href="/admin/seed-questionnaires"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Seed Questionnaires →
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Test simple page (routing test):
                </p>
                <Link
                  href="/admin/test-simple"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Test Simple Page →
                </Link>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-700 mb-2">
                You can also seed content using the command line:
              </p>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                npm run seed:legal
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleLayout>
  )
}
