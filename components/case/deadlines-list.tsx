"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Plus, Edit, Trash2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { getDeadlineStatus, daysUntilDeadline } from "@/lib/case/deadline-calculator"

interface Deadline {
  id: string
  title: string
  description?: string | null
  dueDate: Date | string
  completed: boolean
  reminderSent: boolean
}

interface DeadlinesListProps {
  caseInfo: any
  onUpdate: () => void
}

export function DeadlinesList({ caseInfo, onUpdate }: DeadlinesListProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>(caseInfo?.deadlines || [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    completed: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (caseInfo?.deadlines) {
      setDeadlines(caseInfo.deadlines)
    }
  }, [caseInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editingId) {
        const response = await fetch(`/api/case/deadlines/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to update deadline")
        }
      } else {
        const response = await fetch("/api/case/deadlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to create deadline")
        }
      }

      onUpdate()
      setShowForm(false)
      setEditingId(null)
      setFormData({ title: "", description: "", dueDate: "", completed: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save deadline")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (deadline: Deadline) => {
    setEditingId(deadline.id)
    setFormData({
      title: deadline.title,
      description: deadline.description || "",
      dueDate: new Date(deadline.dueDate).toISOString().split("T")[0],
      completed: deadline.completed,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deadline?")) return

    try {
      const response = await fetch(`/api/case/deadlines/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete deadline")
      }

      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deadline")
    }
  }

  const handleGenerateFromFiling = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/case/deadlines/generate-from-filing", {
        method: "POST",
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to generate")
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate deadlines")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (deadline: Deadline) => {
    try {
      const response = await fetch(`/api/case/deadlines/${deadline.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !deadline.completed }),
      })

      if (!response.ok) {
        throw new Error("Failed to update deadline")
      }

      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deadline")
    }
  }

  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime()
    const dateB = new Date(b.dueDate).getTime()
    return dateA - dateB
  })

  const upcomingDeadlines = sortedDeadlines.filter((d) => !d.completed)
  const overdueDeadlines = upcomingDeadlines.filter((d) => {
    const status = getDeadlineStatus(new Date(d.dueDate), d.completed)
    return status.status === "overdue"
  })
  const approachingDeadlines = upcomingDeadlines.filter((d) => {
    const status = getDeadlineStatus(new Date(d.dueDate), d.completed)
    return status.status === "approaching"
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deadlines</CardTitle>
              <CardDescription>
                Track important deadlines and due dates for your case
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {caseInfo?.filingDate && (
                <Button
                  variant="outline"
                  onClick={handleGenerateFromFiling}
                  disabled={loading}
                >
                  {loading ? "Generating…" : "Generate from filing date"}
                </Button>
              )}
              <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deadline
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {overdueDeadlines.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {overdueDeadlines.length} overdue deadline{overdueDeadlines.length !== 1 ? "s" : ""}
              </AlertDescription>
            </Alert>
          )}

          {approachingDeadlines.length > 0 && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You have {approachingDeadlines.length} deadline{approachingDeadlines.length !== 1 ? "s" : ""} approaching within 7 days
              </AlertDescription>
            </Alert>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {editingId ? "Update" : "Create"} Deadline
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({ title: "", description: "", dueDate: "", completed: false })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {sortedDeadlines.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No deadlines yet. Click "Add Deadline" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedDeadlines.map((deadline) => {
                const status = getDeadlineStatus(new Date(deadline.dueDate), deadline.completed)
                const daysUntil = daysUntilDeadline(new Date(deadline.dueDate))

                return (
                  <div
                    key={deadline.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 ${
                      status.status === "overdue" ? "border-red-300 bg-red-50" : ""
                    } ${status.status === "approaching" ? "border-yellow-300 bg-yellow-50" : ""}`}
                  >
                    <button
                      onClick={() => handleToggleComplete(deadline)}
                      className="mt-1"
                    >
                      {deadline.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-semibold ${
                            deadline.completed ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {deadline.title}
                        </h3>
                        {!deadline.completed && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              status.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : status.status === "approaching"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {status.status === "overdue"
                              ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""}`
                              : status.status === "approaching"
                              ? `${daysUntil} day${daysUntil !== 1 ? "s" : ""} left`
                              : `${daysUntil} day${daysUntil !== 1 ? "s" : ""} left`}
                          </span>
                        )}
                      </div>
                      {deadline.description && (
                        <p className="text-sm text-gray-600 mt-1">{deadline.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(deadline.dueDate), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(deadline)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(deadline.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
