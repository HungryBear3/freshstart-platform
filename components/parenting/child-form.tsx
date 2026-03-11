"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, X, AlertCircle } from "lucide-react"

interface Child {
  id?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: Date | string
  gender?: string | null
  ssn?: string | null
  currentAddress?: string | null
  currentSchool?: string | null
  currentGrade?: string | null
  currentDoctor?: string | null
  currentHealthInsurance?: string | null
}

interface ChildFormProps {
  child?: Child | null
  onClose: () => void
  onSave: () => void
}

export function ChildForm({ child, onClose, onSave }: ChildFormProps) {
  const [formData, setFormData] = useState({
    firstName: child?.firstName || "",
    lastName: child?.lastName || "",
    dateOfBirth: child?.dateOfBirth
      ? new Date(child.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: child?.gender || "",
    ssn: child?.ssn || "",
    currentAddress: child?.currentAddress || "",
    currentSchool: child?.currentSchool || "",
    currentGrade: child?.currentGrade || "",
    currentDoctor: child?.currentDoctor || "",
    currentHealthInsurance: child?.currentHealthInsurance || "",
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const url = child?.id ? `/api/children/${child.id}` : "/api/children"
      const method = child?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save child")
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save child")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{child ? "Edit Child" : "Add Child"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ssn">SSN (Optional)</Label>
              <Input
                id="ssn"
                type="text"
                value={formData.ssn}
                onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">
                This information is encrypted and stored securely
              </p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Current Information</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="currentAddress">Current Address</Label>
                <Input
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                  placeholder="Street address, city, state, zip"
                />
              </div>

              <div>
                <Label htmlFor="currentSchool">Current School</Label>
                <Input
                  id="currentSchool"
                  value={formData.currentSchool}
                  onChange={(e) => setFormData({ ...formData, currentSchool: e.target.value })}
                  placeholder="School name"
                />
              </div>

              <div>
                <Label htmlFor="currentGrade">Current Grade</Label>
                <Input
                  id="currentGrade"
                  value={formData.currentGrade}
                  onChange={(e) => setFormData({ ...formData, currentGrade: e.target.value })}
                  placeholder="e.g., 3rd Grade, 10th Grade"
                />
              </div>

              <div>
                <Label htmlFor="currentDoctor">Current Doctor/Healthcare Provider</Label>
                <Input
                  id="currentDoctor"
                  value={formData.currentDoctor}
                  onChange={(e) => setFormData({ ...formData, currentDoctor: e.target.value })}
                  placeholder="Doctor or clinic name"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="currentHealthInsurance">Health Insurance</Label>
                <Input
                  id="currentHealthInsurance"
                  value={formData.currentHealthInsurance}
                  onChange={(e) => setFormData({ ...formData, currentHealthInsurance: e.target.value })}
                  placeholder="Insurance provider name"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : child ? "Update Child" : "Add Child"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
