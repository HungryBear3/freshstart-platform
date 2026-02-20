"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Baby, Plus, Edit, Trash2, Calendar, MapPin, GraduationCap, Heart, X } from "lucide-react"
import { format } from "date-fns"
import { ChildForm } from "./child-form"
import { ChildTimeline } from "./child-timeline"

interface Child {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date | string
  gender?: string | null
  currentAddress?: string | null
  currentSchool?: string | null
  currentGrade?: string | null
  currentDoctor?: string | null
  currentHealthInsurance?: string | null
  addressHistory: any[]
  schoolHistory: any[]
  doctorHistory: any[]
}

interface ChildrenListProps {
  children: Child[]
  onUpdate: () => void
}

export function ChildrenList({ children, onUpdate }: ChildrenListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [viewingTimeline, setViewingTimeline] = useState<string | null>(null)

  const handleEdit = (child: Child) => {
    setEditingChild(child)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this child's information?")) {
      return
    }

    try {
      const response = await fetch(`/api/children/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete child")
      }

      onUpdate()
    } catch (error) {
      console.error("Error deleting child:", error)
      alert("Failed to delete child. Please try again.")
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingChild(null)
    onUpdate()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Children's Information</CardTitle>
              <CardDescription>
                Manage information about your children including schools, doctors, and addresses
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Child
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewingTimeline && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Child Timeline</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewingTimeline(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ChildTimeline
                child={children.find((c) => c.id === viewingTimeline)!}
              />
            </div>
          )}

          {showForm && (
            <div className="mb-6">
              <ChildForm
                child={editingChild}
                onClose={handleFormClose}
                onSave={handleFormClose}
              />
            </div>
          )}

          {viewingTimeline && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Child Timeline</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewingTimeline(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ChildTimeline
                child={children.find((c) => c.id === viewingTimeline)!}
              />
            </div>
          )}

          {children.length === 0 ? (
            <div className="text-center py-12">
              <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No children added yet</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Child
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {children.map((child) => {
                const age = Math.floor(
                  (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25)
                )

                return (
                  <Card key={child.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {child.firstName} {child.lastName}
                          </CardTitle>
                          <CardDescription>
                            Age {age} • {format(new Date(child.dateOfBirth), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingTimeline(child.id)}
                            title="View timeline"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(child)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(child.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {child.currentSchool && (
                        <div className="flex items-start gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <span className="font-medium">School:</span> {child.currentSchool}
                            {child.currentGrade && ` (${child.currentGrade})`}
                          </div>
                        </div>
                      )}

                      {child.currentAddress && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Address:</span> {child.currentAddress}
                          </div>
                        </div>
                      )}

                      {child.currentDoctor && (
                        <div className="flex items-start gap-2 text-sm">
                          <Heart className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Doctor:</span> {child.currentDoctor}
                          </div>
                        </div>
                      )}

                      {child.currentHealthInsurance && (
                        <div className="flex items-start gap-2 text-sm">
                          <Heart className="h-4 w-4 text-purple-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Insurance:</span> {child.currentHealthInsurance}
                          </div>
                        </div>
                      )}

                      {!child.currentSchool && !child.currentAddress && !child.currentDoctor && (
                        <p className="text-sm text-gray-500 italic">
                          No additional information added yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
