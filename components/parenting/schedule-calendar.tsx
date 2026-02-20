"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ScheduleCalendarProps {
  weeklySchedule: any
  holidays: any[]
  summerVacation: any
  schoolBreaks: any[]
}

export function ScheduleCalendar({
  weeklySchedule,
  holidays = [],
  summerVacation,
  schoolBreaks = [],
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getParentForDate = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase()
    return weeklySchedule?.[dayName]?.parent || ""
  }

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return holidays.find((h) => h.date === dateStr)
  }

  const getSchoolBreakForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return schoolBreaks.find((b) => {
      const start = new Date(b.startDate)
      const end = new Date(b.endDate)
      return date >= start && date <= end
    })
  }

  const getSummerVacationForDate = (date: Date) => {
    if (!summerVacation?.startDate || !summerVacation?.endDate) return null
    const start = new Date(summerVacation.startDate)
    const end = new Date(summerVacation.endDate)
    return date >= start && date <= end ? summerVacation : null
  }

  const getDayColor = (date: Date) => {
    const holiday = getHolidayForDate(date)
    if (holiday) {
      if (holiday.parent === "parent1") return "bg-blue-100 border-blue-300"
      if (holiday.parent === "parent2") return "bg-green-100 border-green-300"
      if (holiday.parent === "both") return "bg-purple-100 border-purple-300"
      return "bg-yellow-100 border-yellow-300"
    }

    const breakItem = getSchoolBreakForDate(date)
    if (breakItem) {
      if (breakItem.parent === "parent1") return "bg-blue-50 border-blue-200"
      if (breakItem.parent === "parent2") return "bg-green-50 border-green-200"
      return "bg-gray-50 border-gray-200"
    }

    const summer = getSummerVacationForDate(date)
    if (summer) {
      return "bg-orange-50 border-orange-200"
    }

    const parent = getParentForDate(date)
    if (parent === "parent1") return "bg-blue-50 border-blue-200"
    if (parent === "parent2") return "bg-green-50 border-green-200"
    if (parent === "both") return "bg-purple-50 border-purple-200"
    if (parent === "alternating") return "bg-yellow-50 border-yellow-200"

    return "bg-white border-gray-200"
  }

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Parenting Schedule Calendar</CardTitle>
            <CardDescription>Visual calendar view of parenting time arrangements</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold w-48 text-center">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const holiday = getHolidayForDate(day)
            const breakItem = getSchoolBreakForDate(day)
            const summer = getSummerVacationForDate(day)
            const parent = getParentForDate(day)

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border ${getDayColor(day)} ${
                  !isCurrentMonth ? "opacity-50" : ""
                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1 text-xs">
                  {holiday && (
                    <div className="bg-yellow-200 text-yellow-900 px-1 rounded truncate">
                      {holiday.name}
                    </div>
                  )}
                  {breakItem && !holiday && (
                    <div className="bg-gray-200 text-gray-800 px-1 rounded truncate">
                      {breakItem.name}
                    </div>
                  )}
                  {summer && !holiday && !breakItem && (
                    <div className="bg-orange-200 text-orange-900 px-1 rounded truncate">
                      Summer
                    </div>
                  )}
                  {!holiday && !breakItem && !summer && parent && (
                    <div className="text-gray-700 truncate">
                      {parent === "parent1" ? "P1" : parent === "parent2" ? "P2" : parent === "both" ? "Both" : "Alt"}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Parent 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Parent 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Both/Shared</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span>Summer Vacation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
