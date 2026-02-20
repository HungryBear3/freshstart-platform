"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle2 } from "lucide-react"

interface CalendarViewProps {
  milestones: Array<{
    id: string
    title: string
    date: Date | string
    completed: boolean
  }>
  deadlines: Array<{
    id: string
    title: string
    dueDate: Date | string
    completed: boolean
  }>
}

export function CalendarView({ milestones, deadlines }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const dayMilestones = milestones.filter((m) => {
      const milestoneDate = format(new Date(m.date), "yyyy-MM-dd")
      return milestoneDate === dateStr
    })
    const dayDeadlines = deadlines.filter((d) => {
      const deadlineDate = format(new Date(d.dueDate), "yyyy-MM-dd")
      return deadlineDate === dateStr
    })
    return { milestones: dayMilestones, deadlines: dayDeadlines }
  }

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>View your milestones and deadlines on a calendar</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const events = getEventsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const hasEvents = events.milestones.length > 0 || events.deadlines.length > 0

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[80px] p-1 border border-gray-200 ${
                    !isCurrentMonth ? "bg-gray-50" : "bg-white"
                  } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {events.milestones.slice(0, 2).map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`text-xs p-1 rounded truncate ${
                          milestone.completed
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                        title={milestone.title}
                      >
                        <CheckCircle2 className="inline h-3 w-3 mr-1" />
                        {milestone.title}
                      </div>
                    ))}
                    {events.deadlines.slice(0, 2).map((deadline) => (
                      <div
                        key={deadline.id}
                        className={`text-xs p-1 rounded truncate ${
                          deadline.completed
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                        title={deadline.title}
                      >
                        <Clock className="inline h-3 w-3 mr-1" />
                        {deadline.title}
                      </div>
                    ))}
                    {(events.milestones.length > 2 || events.deadlines.length > 2) && (
                      <div className="text-xs text-gray-500">
                        +{events.milestones.length + events.deadlines.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === "week" && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">Week view coming soon</p>
            {/* Week view implementation can be added here */}
          </div>
        )}

        {viewMode === "day" && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">Day view coming soon</p>
            {/* Day view implementation can be added here */}
          </div>
        )}

        <div className="mt-6 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>Milestones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 rounded"></div>
            <span>Deadlines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
