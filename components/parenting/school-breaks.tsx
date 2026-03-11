"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save } from "lucide-react"

interface SchoolBreaksProps {
  schoolBreaks: any
  onSave: (breaks: any) => void
}

const COMMON_BREAKS = [
  "Fall Break",
  "Thanksgiving Break",
  "Winter Break",
  "Spring Break",
  "Easter Break",
  "Memorial Day Weekend",
  "Labor Day Weekend",
]

export function SchoolBreaks({ schoolBreaks, onSave }: SchoolBreaksProps) {
  const [breaks, setBreaks] = useState<any[]>(schoolBreaks || [])

  const addBreak = () => {
    setBreaks([
      ...breaks,
      {
        id: Date.now().toString(),
        name: "",
        startDate: "",
        endDate: "",
        parent: "",
        notes: "",
      },
    ])
  }

  const removeBreak = (id: string) => {
    setBreaks(breaks.filter((b) => b.id !== id))
  }

  const updateBreak = (id: string, field: string, value: string) => {
    setBreaks(breaks.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  const handleSave = () => {
    onSave(breaks)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>School Break Schedule</CardTitle>
            <CardDescription>
              Define parenting time arrangements for school breaks and holidays
            </CardDescription>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Breaks
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breaks.map((breakItem) => (
            <div
              key={breakItem.id}
              className="grid grid-cols-1 gap-4 md:grid-cols-5 p-4 border rounded-lg"
            >
              <div>
                <Label>Break Name</Label>
                <Select
                  value={breakItem.name}
                  onValueChange={(value) => updateBreak(breakItem.id, "name", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select break" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_BREAKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {breakItem.name === "custom" && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom break name"
                    value={breakItem.customName || ""}
                    onChange={(e) => updateBreak(breakItem.id, "customName", e.target.value)}
                  />
                )}
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={breakItem.startDate}
                  onChange={(e) => updateBreak(breakItem.id, "startDate", e.target.value)}
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={breakItem.endDate}
                  onChange={(e) => updateBreak(breakItem.id, "endDate", e.target.value)}
                />
              </div>

              <div>
                <Label>Parent</Label>
                <Select
                  value={breakItem.parent}
                  onValueChange={(value) => updateBreak(breakItem.id, "parent", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent1">Parent 1</SelectItem>
                    <SelectItem value="parent2">Parent 2</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="alternating">Alternating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    value={breakItem.notes || ""}
                    onChange={(e) => updateBreak(breakItem.id, "notes", e.target.value)}
                    placeholder="Notes"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBreak(breakItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addBreak} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add School Break
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
