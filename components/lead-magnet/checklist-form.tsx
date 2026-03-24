"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Download, Loader2 } from "lucide-react"

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
      <div className={variant === "page" ? "text-center py-8" : "py-4"}>
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-900">Check your inbox!</p>
        <p className="text-gray-600 mt-1">
          The Illinois Divorce Checklist is on its way to <strong>{email}</strong>.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Don&apos;t see it? Check your spam folder.
        </p>
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
      <p className="text-xs text-blue-600 font-semibold mt-2 text-center">
        No account needed. No spam. Instant delivery.
      </p>
    </form>
  )
}
