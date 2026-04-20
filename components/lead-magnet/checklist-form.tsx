"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Download, Loader2, ArrowRight } from "lucide-react"

interface ChecklistFormProps {
  variant?: "page" | "inline"
}

export function ChecklistForm({ variant = "page" }: ChecklistFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong. Please try again.")
        setStatus("error")
        return
      }
      setStatus("success")
    } catch {
      setErrorMessage("Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className={variant === "page" ? "text-center py-6" : "py-4"}>
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-900">Check your inbox!</p>
        <p className="text-gray-600 mt-1">
          The Illinois Divorce Checklist is on its way to <strong>{email}</strong>.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Don&apos;t see it? Check your spam folder.
        </p>
        {variant === "page" && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-1">Ready to go further?</p>
            <p className="text-sm text-blue-800 mb-3">
              FreshStart IL generates your complete Illinois divorce packet — petition, financial
              affidavit, and parenting plan — from plain-English questions.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get started — $299/year
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-3 ${variant === "page" ? "flex-col sm:flex-row max-w-md mx-auto" : "flex-col sm:flex-row"}`}>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
          className="flex-1 h-11"
          aria-label="Email address for checklist delivery"
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-11 whitespace-nowrap"
          size={variant === "page" ? "lg" : "default"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Send Free Checklist
            </>
          )}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600 mt-2 text-center">{errorMessage}</p>
      )}
      <p className={`text-xs font-semibold mt-2 text-center ${variant === "inline" ? "text-blue-100" : "text-blue-600"}`}>
        No account needed. No spam. Instant delivery.
      </p>
    </form>
  )
}
