"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function InviteAcceptPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleAccept = async () => {
    if (!token) {
      setMessage("Invalid invitation link")
      setStatus("error")
      return
    }

    setStatus("loading")
    try {
      const res = await fetch(`/api/case/invite/accept?token=${encodeURIComponent(token)}`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Failed to accept invitation")
        setStatus("error")
        if (res.status === 401) {
          setTimeout(() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`), 1500)
        }
        return
      }

      setStatus("success")
      setTimeout(() => router.push("/dashboard/case"), 2000)
    } catch {
      setMessage("Something went wrong")
      setStatus("error")
    }
  }

  if (!token) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid invitation link. Please ask your spouse to send a new invitation.
            </AlertDescription>
          </Alert>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Case Invitation</CardTitle>
            <p className="text-sm text-muted-foreground">
              You&apos;ve been invited to collaborate on a divorce case. Sign in and accept to view the shared case.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Invitation accepted! Redirecting to the case...
                </AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === "idle" && (
              <div className="flex gap-2">
                <Button onClick={handleAccept}>Accept Invitation</Button>
                <Link href="/dashboard">
                  <Button variant="outline">Decline</Button>
                </Link>
              </div>
            )}

            {status === "loading" && (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
