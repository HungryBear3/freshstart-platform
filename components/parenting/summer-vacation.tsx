"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

interface SummerVacationProps {
  summerSchedule: any
  onSave: (schedule: any) => void
}

export function SummerVacation({ summerSchedule, onSave }: SummerVacationProps) {
  const [schedule, setSchedule] = useState<any>(
    summerSchedule || {
      startDate: "",
      endDate: "",
      arrangement: "",
      parent1Weeks: "",
      parent2Weeks: "",
      alternating: false,
      notes: "",
    }
  )

  const handleChange = (field: string, value: any) => {
    setSchedule({ ...schedule, [field]: value })
  }

  const handleSave = () => {
    onSave(schedule)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Summer Vacation Schedule</CardTitle>
            <CardDescription>
              Define parenting time arrangements for summer vacation
            </CardDescription>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Summer Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={schedule.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Summer End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={schedule.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="arrangement">Arrangement Type</Label>
            <Select
              value={schedule.arrangement}
              onValueChange={(value) => handleChange("arrangement", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select arrangement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alternating_weeks">Alternating Weeks</SelectItem>
                <SelectItem value="split_summer">Split Summer (e.g., 6 weeks each)</SelectItem>
                <SelectItem value="first_half_second_half">First Half / Second Half</SelectItem>
                <SelectItem value="specific_dates">Specific Dates</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {schedule.arrangement === "split_summer" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="parent1Weeks">Parent 1 Weeks</Label>
                <Input
                  id="parent1Weeks"
                  type="number"
                  value={schedule.parent1Weeks}
                  onChange={(e) => handleChange("parent1Weeks", e.target.value)}
                  placeholder="Number of weeks"
                />
              </div>

              <div>
                <Label htmlFor="parent2Weeks">Parent 2 Weeks</Label>
                <Input
                  id="parent2Weeks"
                  type="number"
                  value={schedule.parent2Weeks}
                  onChange={(e) => handleChange("parent2Weeks", e.target.value)}
                  placeholder="Number of weeks"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={schedule.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              placeholder="Additional details about summer vacation arrangements..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
