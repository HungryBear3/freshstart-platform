"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"

interface WeeklyScheduleProps {
  schedule: any
  onSave: (schedule: any) => void
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  "Morning (6am-12pm)",
  "Afternoon (12pm-6pm)",
  "Evening (6pm-10pm)",
  "Overnight (10pm-6am)",
]

export function WeeklySchedule({ schedule, onSave }: WeeklyScheduleProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<any>(
    schedule || {
      monday: { parent: "", notes: "" },
      tuesday: { parent: "", notes: "" },
      wednesday: { parent: "", notes: "" },
      thursday: { parent: "", notes: "" },
      friday: { parent: "", notes: "" },
      saturday: { parent: "", notes: "" },
      sunday: { parent: "", notes: "" },
    }
  )

  const handleDayChange = (day: string, field: string, value: string) => {
    setWeeklySchedule({
      ...weeklySchedule,
      [day.toLowerCase()]: {
        ...weeklySchedule[day.toLowerCase()],
        [field]: value,
      },
    })
  }

  const handleSave = () => {
    onSave(weeklySchedule)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Parenting Schedule</CardTitle>
            <CardDescription>
              Define which parent has parenting time on each day of the week
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
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="w-32 font-medium">{day}</div>
              <div className="flex-1">
                <Select
                  value={weeklySchedule[day.toLowerCase()]?.parent || ""}
                  onValueChange={(value) => handleDayChange(day, "parent", value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent1">Parent 1</SelectItem>
                    <SelectItem value="parent2">Parent 2</SelectItem>
                    <SelectItem value="both">Both (Shared)</SelectItem>
                    <SelectItem value="alternating">Alternating</SelectItem>
                    <SelectItem value="none">No Scheduled Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={weeklySchedule[day.toLowerCase()]?.notes || ""}
                  onChange={(e) => handleDayChange(day, "notes", e.target.value)}
                  placeholder="Notes (e.g., school pickup, specific times)"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Schedule Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Parent 1 Days: </span>
              {DAYS.filter(
                (day) => weeklySchedule[day.toLowerCase()]?.parent === "parent1"
              ).length}
            </div>
            <div>
              <span className="font-medium">Parent 2 Days: </span>
              {DAYS.filter(
                (day) => weeklySchedule[day.toLowerCase()]?.parent === "parent2"
              ).length}
            </div>
            <div>
              <span className="font-medium">Shared Days: </span>
              {DAYS.filter(
                (day) => weeklySchedule[day.toLowerCase()]?.parent === "both"
              ).length}
            </div>
            <div>
              <span className="font-medium">Alternating Days: </span>
              {DAYS.filter(
                (day) => weeklySchedule[day.toLowerCase()]?.parent === "alternating"
              ).length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
