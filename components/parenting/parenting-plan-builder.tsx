"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { WeeklySchedule } from "./weekly-schedule"
import { HolidaySchedule } from "./holiday-schedule"
import { SummerVacation } from "./summer-vacation"
import { SchoolBreaks } from "./school-breaks"
import { ParentingPlanTemplates } from "./parenting-plan-templates"
import { ScheduleCalendar } from "./schedule-calendar"

type ParentingPlanFormData = {
  educationAuthority: string
  healthcareAuthority: string
  religiousAuthority: string
  extracurricularAuthority: string
  communicationMethod: string
  communicationFrequency: string
  communicationNotes: string
  weeklySchedule: any | null
  holidays: any | null
  summerVacation: any | null
  schoolBreaks: any | null
}

interface ParentingPlanBuilderProps {
  onPlanUpdate?: () => void
}

export function ParentingPlanBuilder({ onPlanUpdate }: ParentingPlanBuilderProps) {
  const [activeTab, setActiveTab] = useState("decisions")
  const [showTemplates, setShowTemplates] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<ParentingPlanFormData>({
    educationAuthority: "",
    healthcareAuthority: "",
    religiousAuthority: "",
    extracurricularAuthority: "",
    communicationMethod: "",
    communicationFrequency: "",
    communicationNotes: "",
    weeklySchedule: null,
    holidays: null,
    summerVacation: null,
    schoolBreaks: null,
  })

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    try {
      const response = await fetch("/api/parenting-plan")
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setPlan(data)
          setFormData({
            educationAuthority: data.educationAuthority || "",
            healthcareAuthority: data.healthcareAuthority || "",
            religiousAuthority: data.religiousAuthority || "",
            extracurricularAuthority: data.extracurricularAuthority || "",
            communicationMethod: data.communicationMethod || "",
            communicationFrequency: data.communicationFrequency || "",
            communicationNotes: data.communicationNotes || "",
            weeklySchedule: data.weeklySchedule || null,
            holidays: data.holidays || null,
            summerVacation: data.summerVacation || null,
            schoolBreaks: data.schoolBreaks || null,
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch parenting plan:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/parenting-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save parenting plan")
      }

      const updated = await response.json()
      setPlan(updated)
      setSuccess(true)
      onPlanUpdate?.()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save parenting plan")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading parenting plan...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parenting Plan Builder</CardTitle>
          <CardDescription>
            Create a comprehensive parenting plan including decision-making authority and communication protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showTemplates && (
            <div className="mb-6">
              <ParentingPlanTemplates
                onSelectTemplate={(template) => {
                  setFormData({
                    ...formData,
                    weeklySchedule: template.weeklySchedule,
                  })
                  setShowTemplates(false)
                }}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Parenting plan saved successfully</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
              {[
                { id: "decisions", label: "Decision-Making" },
                { id: "communication", label: "Communication" },
                { id: "schedule", label: "Schedule" },
                { id: "calendar", label: "Calendar View" },
              ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === "decisions" && (
              <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4">Decision-Making Authority</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Specify who has decision-making authority for different aspects of your children's lives
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="educationAuthority">Education Decisions</Label>
                    <Select
                      value={formData.educationAuthority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, educationAuthority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select authority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent1">Parent 1</SelectItem>
                        <SelectItem value="parent2">Parent 2</SelectItem>
                        <SelectItem value="joint">Joint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="healthcareAuthority">Healthcare Decisions</Label>
                    <Select
                      value={formData.healthcareAuthority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, healthcareAuthority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select authority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent1">Parent 1</SelectItem>
                        <SelectItem value="parent2">Parent 2</SelectItem>
                        <SelectItem value="joint">Joint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="religiousAuthority">Religious Decisions</Label>
                    <Select
                      value={formData.religiousAuthority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, religiousAuthority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select authority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent1">Parent 1</SelectItem>
                        <SelectItem value="parent2">Parent 2</SelectItem>
                        <SelectItem value="joint">Joint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="extracurricularAuthority">Extracurricular Activities</Label>
                    <Select
                      value={formData.extracurricularAuthority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, extracurricularAuthority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select authority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent1">Parent 1</SelectItem>
                        <SelectItem value="parent2">Parent 2</SelectItem>
                        <SelectItem value="joint">Joint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              </div>
            )}

            {activeTab === "communication" && (
              <div className="space-y-4">
                <div>
                <h3 className="font-semibold mb-4">Communication Protocols</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Establish how parents will communicate about the children
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="communicationMethod">Preferred Communication Method</Label>
                    <Select
                      value={formData.communicationMethod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, communicationMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="text">Text Message</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="app">Parenting App</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="communicationFrequency">Communication Frequency</Label>
                    <Select
                      value={formData.communicationFrequency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, communicationFrequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="as_needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="communicationNotes">Communication Notes</Label>
                    <textarea
                      id="communicationNotes"
                      value={formData.communicationNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, communicationNotes: e.target.value })
                      }
                      className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      placeholder="Add any specific communication protocols or guidelines..."
                    />
                  </div>
                </div>
              </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-6">
                <WeeklySchedule
                  schedule={formData.weeklySchedule}
                  onSave={(schedule) => setFormData({ ...formData, weeklySchedule: schedule })}
                />

                <HolidaySchedule
                  holidays={formData.holidays}
                  onSave={(holidays) => setFormData({ ...formData, holidays })}
                />

                <SummerVacation
                  summerSchedule={formData.summerVacation}
                  onSave={(schedule) => setFormData({ ...formData, summerVacation: schedule })}
                />

                <SchoolBreaks
                  schoolBreaks={formData.schoolBreaks}
                  onSave={(breaks) => setFormData({ ...formData, schoolBreaks: breaks })}
                />
              </div>
            )}

            {activeTab === "calendar" && (
              <ScheduleCalendar
                weeklySchedule={formData.weeklySchedule}
                holidays={formData.holidays || []}
                summerVacation={formData.summerVacation}
                schoolBreaks={formData.schoolBreaks || []}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch("/api/parenting-plan/generate-pdf", {
                    method: "POST",
                  })

                  if (!response.ok) {
                    throw new Error("Failed to generate PDF")
                  }

                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `parenting-plan-${Date.now()}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                } catch (error) {
                  console.error("Error generating PDF:", error)
                  alert("Failed to generate PDF. Please try again.")
                }
              }}
            >
              Generate PDF
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Parenting Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
