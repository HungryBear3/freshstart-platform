"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock, AlertCircle, FileText } from "lucide-react"
import { format } from "date-fns"
import { getDeadlineStatus } from "@/lib/case/deadline-calculator"

interface ChecklistViewProps {
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
  }>
}

type FilterType = "all" | "pending" | "completed" | "overdue"

export function ChecklistView({ milestones, deadlines, documents = [] }: ChecklistViewProps) {
  const [filter, setFilter] = useState<FilterType>("all")

  const allItems = useMemo(() => {
    const items: Array<{
      id: string
      type: "milestone" | "deadline" | "document"
      title: string
      description?: string | null
      date?: Date | string
      completed: boolean
      status?: string
      overdue?: boolean
    }> = []

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
      const status = getDeadlineStatus(new Date(d.dueDate), d.completed)
      items.push({
        id: d.id,
        type: "deadline",
        title: d.title,
        description: d.description,
        date: d.dueDate,
        completed: d.completed,
        overdue: status.status === "overdue",
      })
    })

    // Add documents
    documents.forEach((doc) => {
      items.push({
        id: doc.id,
        type: "document",
        title: doc.fileName,
        description: `Type: ${doc.type}`,
        completed: ["filed", "accepted"].includes(doc.status),
        status: doc.status,
      })
    })

    return items
  }, [milestones, deadlines, documents])

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "pending":
        return allItems.filter((item) => !item.completed && !item.overdue)
      case "completed":
        return allItems.filter((item) => item.completed)
      case "overdue":
        return allItems.filter((item) => item.overdue || (!item.completed && item.type === "deadline" && new Date(item.date || 0) < new Date()))
      default:
        return allItems
    }
  }, [allItems, filter])

  const stats = useMemo(() => {
    const total = allItems.length
    const completed = allItems.filter((item) => item.completed).length
    const pending = allItems.filter((item) => !item.completed && !item.overdue).length
    const overdue = allItems.filter((item) => item.overdue || (!item.completed && item.type === "deadline" && new Date(item.date || 0) < new Date())).length

    return { total, completed, pending, overdue }
  }, [allItems])

  const getIcon = (type: string, completed: boolean, overdue?: boolean) => {
    if (completed) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    if (overdue) {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
    switch (type) {
      case "milestone":
        return <Circle className="h-5 w-5 text-blue-600" />
      case "deadline":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "document":
        return <FileText className="h-5 w-5 text-gray-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "milestone":
        return "Milestone"
      case "deadline":
        return "Deadline"
      case "document":
        return "Document"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>View all your case tasks and items</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={filter === "overdue" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("overdue")}
            >
              Overdue ({stats.overdue})
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed ({stats.completed})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-red-600">Overdue</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items found for this filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 border rounded-lg ${
                  item.completed ? "bg-gray-50 opacity-75" : "bg-white"
                } ${item.overdue ? "border-red-300 bg-red-50" : ""}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(item.type, item.completed, item.overdue)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                    {item.overdue && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.type === "deadline" ? "Due: " : "Date: "}
                      {format(new Date(item.date), "MMM d, yyyy")}
                    </p>
                  )}
                  {item.status && (
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {item.status.replace("_", " ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
