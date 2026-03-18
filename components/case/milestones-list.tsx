"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Circle, Plus, Edit, Trash2, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Milestone {
  id: string
  title: string
  description?: string | null
  date: Date | string
  completed: boolean
}

interface MilestonesListProps {
  caseInfo: any
  onUpdate: () => void
}

export function MilestonesList({ caseInfo, onUpdate }: MilestonesListProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    caseInfo?.milestones || []
  )

  useEffect(() => {
    if (caseInfo?.milestones) {
      setMilestones(caseInfo.milestones)
    }
  }, [caseInfo])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    completed: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editingId) {
        // Update existing milestone
        const response = await fetch(`/api/case/milestones/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to update milestone")
        }
      } else {
        // Create new milestone
        const response = await fetch("/api/case/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to create milestone")
        }
      }

      onUpdate()
      setShowForm(false)
      setEditingId(null)
      setFormData({ title: "", description: "", date: "", completed: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save milestone")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (milestone: Milestone) => {
    setEditingId(milestone.id)
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      date: new Date(milestone.date).toISOString().split("T")[0],
      completed: milestone.completed,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return

    try {
      const response = await fetch(`/api/case/milestones/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete milestone")
      }

      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete milestone")
    }
  }

  const handleToggleComplete = async (milestone: Milestone) => {
    try {
      const response = await fetch(`/api/case/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !milestone.completed }),
      })

      if (!response.ok) {
        throw new Error("Failed to update milestone")
      }

      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update milestone")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Track important dates and events in your case
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
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
                <Label htmlFor="description">Description / Notes</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add detailed notes or description..."
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {editingId ? "Update" : "Create"} Milestone
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({ title: "", description: "", date: "", completed: false })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {milestones.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No milestones yet. Click "Add Milestone" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleToggleComplete(milestone)}
                    className="mt-1"
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold ${
                          milestone.completed ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {milestone.title}
                      </h3>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(milestone.date), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(milestone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
