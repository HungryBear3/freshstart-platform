"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save } from "lucide-react"

interface HolidayScheduleProps {
  holidays: any
  onSave: (holidays: any) => void
}

const COMMON_HOLIDAYS = [
  "New Year's Day",
  "Martin Luther King Jr. Day",
  "Valentine's Day",
  "Easter",
  "Mother's Day",
  "Memorial Day",
  "Father's Day",
  "Independence Day",
  "Labor Day",
  "Halloween",
  "Thanksgiving",
  "Christmas Eve",
  "Christmas Day",
  "New Year's Eve",
]

export function HolidaySchedule({ holidays, onSave }: HolidayScheduleProps) {
  const [holidayList, setHolidayList] = useState<any[]>(
    holidays || []
  )

  const addHoliday = () => {
    setHolidayList([
      ...holidayList,
      {
        id: Date.now().toString(),
        name: "",
        date: "",
        parent: "",
        notes: "",
      },
    ])
  }

  const removeHoliday = (id: string) => {
    setHolidayList(holidayList.filter((h) => h.id !== id))
  }

  const updateHoliday = (id: string, field: string, value: string) => {
    setHolidayList(
      holidayList.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    )
  }

  const handleSave = () => {
    onSave(holidayList)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Holiday & Special Occasion Schedule</CardTitle>
            <CardDescription>
              Define parenting time arrangements for holidays and special occasions
            </CardDescription>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Holidays
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {holidayList.map((holiday) => (
            <div
              key={holiday.id}
              className="grid grid-cols-1 gap-4 md:grid-cols-5 p-4 border rounded-lg"
            >
              <div>
                <Label>Holiday Name</Label>
                <Select
                  value={holiday.name}
                  onValueChange={(value) => updateHoliday(holiday.id, "name", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_HOLIDAYS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {holiday.name === "custom" && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom holiday name"
                    value={holiday.customName || ""}
                    onChange={(e) => updateHoliday(holiday.id, "customName", e.target.value)}
                  />
                )}
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={holiday.date}
                  onChange={(e) => updateHoliday(holiday.id, "date", e.target.value)}
                />
              </div>

              <div>
                <Label>Parent</Label>
                <Select
                  value={holiday.parent}
                  onValueChange={(value) => updateHoliday(holiday.id, "parent", value)}
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

              <div>
                <Label>Notes</Label>
                <Input
                  value={holiday.notes || ""}
                  onChange={(e) => updateHoliday(holiday.id, "notes", e.target.value)}
                  placeholder="Special arrangements"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHoliday(holiday.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addHoliday} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
