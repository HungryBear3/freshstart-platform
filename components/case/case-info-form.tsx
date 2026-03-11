"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, AlertCircle, CheckCircle2 } from "lucide-react"

interface Milestone {
  id: string
  title: string
  description?: string | null
  date: Date | string
  completed: boolean
}

interface Deadline {
  id: string
  title: string
  description?: string | null
  dueDate: Date | string
  completed: boolean
  reminderSent: boolean
}

interface CaseInfo {
  id: string
  caseNumber?: string | null
  courtName?: string | null
  county?: string | null
  judgeName?: string | null
  filingDate?: Date | string | null
  status: string
  milestones: Milestone[]
  deadlines: Deadline[]
}

interface CaseInfoFormProps {
  caseInfo: CaseInfo | null
  onUpdate: (caseInfo: CaseInfo) => void
}

export function CaseInfoForm({ caseInfo, onUpdate }: CaseInfoFormProps) {
  const [formData, setFormData] = useState({
    caseNumber: caseInfo?.caseNumber || "",
    courtName: caseInfo?.courtName || "",
    county: caseInfo?.county || "",
    judgeName: caseInfo?.judgeName || "",
    filingDate: caseInfo?.filingDate
      ? new Date(caseInfo.filingDate).toISOString().split("T")[0]
      : "",
    status: caseInfo?.status || "not_filed",
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save case information")
      }

      const updated = await response.json()
      onUpdate(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save case information")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Information</CardTitle>
        <CardDescription>
          Enter your case details including case number, court, and filing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Case information saved successfully</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                placeholder="e.g., 2024-DR-1234"
              />
            </div>

            <div>
              <Label htmlFor="status">Case Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_filed">Not Filed</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                placeholder="e.g., Cook County"
              />
            </div>

            <div>
              <Label htmlFor="courtName">Court Name</Label>
              <Input
                id="courtName"
                value={formData.courtName}
                onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                placeholder="e.g., Circuit Court of Cook County"
              />
            </div>

            <div>
              <Label htmlFor="judgeName">Judge Name</Label>
              <Input
                id="judgeName"
                value={formData.judgeName}
                onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
                placeholder="e.g., Hon. John Smith"
              />
            </div>

            <div>
              <Label htmlFor="filingDate">Filing Date</Label>
              <Input
                id="filingDate"
                type="date"
                value={formData.filingDate}
                onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Case Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
