"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CheckCircle2, Clock, FileText, Calendar, Circle, Download } from "lucide-react"
import { getDeadlineStatus } from "@/lib/case/deadline-calculator"

interface TimelineViewProps {
  milestones: Array<{
    id: string
    title: string
    description?: string | null
    date: Date | string
    completed: boolean
  }>
  deadlines: Array<{
    id: string
    title: string
    description?: string | null
    dueDate: Date | string
    completed: boolean
  }>
  documents?: Array<{
    id: string
    type: string
    fileName: string
    status: string
    generatedAt: Date | string
  }>
  filingDate?: Date | string | null
}

export function TimelineView({
  milestones,
  deadlines,
  documents = [],
  filingDate,
}: TimelineViewProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/case/export-timeline")
      if (!response.ok) {
        throw new Error("Failed to export timeline")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `case-timeline-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export timeline. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const timelineItems = useMemo(() => {
    const items: Array<{
      id: string
      type: "milestone" | "deadline" | "document" | "filing"
      title: string
      description?: string | null
      date: Date | string
      completed: boolean
      status?: string
    }> = []

    // Add filing date if available
    if (filingDate) {
      items.push({
        id: "filing",
        type: "filing",
        title: "Case Filed",
        description: "Petition for Dissolution filed with the court",
        date: filingDate,
        completed: true,
      })
    }

    // Add milestones
    milestones.forEach((m) => {
      items.push({
        id: m.id,
        type: "milestone",
        title: m.title,
        description: m.description,
        date: m.date,
        completed: m.completed,
      })
    })

    // Add deadlines
    deadlines.forEach((d) => {
      items.push({
        id: d.id,
        type: "deadline",
        title: d.title,
        description: d.description,
        date: d.dueDate,
        completed: d.completed,
      })
    })

    // Add documents
    documents.forEach((doc) => {
      items.push({
        id: doc.id,
        type: "document",
        title: doc.fileName,
        description: `Type: ${doc.type}`,
        date: doc.generatedAt,
        completed: ["filed", "accepted"].includes(doc.status),
        status: doc.status,
      })
    })

    // Sort by date
    return items.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }, [milestones, deadlines, documents, filingDate])

  const getIcon = (type: string, completed: boolean) => {
    if (completed) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }

    switch (type) {
      case "milestone":
        return <Calendar className="h-5 w-5 text-blue-600" />
      case "deadline":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "document":
        return <FileText className="h-5 w-5 text-purple-600" />
      case "filing":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (item: typeof timelineItems[0]) => {
    if (item.completed) {
      return "bg-green-50 border-green-200"
    }
    if (item.type === "deadline") {
      const status = getDeadlineStatus(new Date(item.date), item.completed)
      if (status.status === "overdue") {
        return "bg-red-50 border-red-200"
      }
      if (status.status === "approaching") {
        return "bg-yellow-50 border-yellow-200"
      }
    }
    return "bg-white border-gray-200"
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "milestone":
        return "Milestone"
      case "deadline":
        return "Deadline"
      case "document":
        return "Document"
      case "filing":
        return "Filing"
      default:
        return type
    }
  }

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Visual timeline of your case events</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">No timeline items yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Case Timeline</CardTitle>
            <CardDescription>Chronological view of all case events and deadlines</CardDescription>
          </div>
          <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export Timeline"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          <div className="space-y-6">
            {timelineItems.map((item, index) => {
              const isPast = new Date(item.date) < new Date()
              const isToday = format(new Date(item.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

              return (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      item.completed
                        ? "bg-green-100 border-green-500"
                        : isPast && !item.completed
                        ? "bg-red-100 border-red-500"
                        : "bg-white border-gray-400"
                    }`}
                  >
                    {getIcon(item.type, item.completed)}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 rounded-lg border p-4 ${getStatusColor(item)} ${
                      isToday ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
                              item.completed ? "line-through text-gray-500" : ""
                            }`}
                          >
                            {item.title}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {getTypeLabel(item.type)}
                          </span>
                          {item.completed && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                              Completed
                            </span>
                          )}
                          {isToday && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              Today
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
                          {item.type === "deadline" && !item.completed && (
                            <span>
                              {(() => {
                                const status = getDeadlineStatus(new Date(item.date), item.completed)
                                if (status.status === "overdue") {
                                  return `Overdue by ${Math.abs(status.daysUntil)} days`
                                }
                                if (status.status === "approaching") {
                                  return `${status.daysUntil} days remaining`
                                }
                                return `${status.daysUntil} days remaining`
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
