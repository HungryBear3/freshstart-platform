"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { MapPin, GraduationCap, Heart, Calendar } from "lucide-react"

interface ChildTimelineProps {
  child: {
    id: string
    firstName: string
    lastName: string
    addressHistory: Array<{
      id: string
      address: string
      startDate: Date | string
      endDate?: Date | string | null
      isCurrent: boolean
    }>
    schoolHistory: Array<{
      id: string
      schoolName: string
      grade?: string | null
      startDate: Date | string
      endDate?: Date | string | null
      isCurrent: boolean
    }>
    doctorHistory: Array<{
      id: string
      providerName: string
      providerType?: string | null
      startDate: Date | string
      endDate?: Date | string | null
      isCurrent: boolean
    }>
  }
}

export function ChildTimeline({ child }: ChildTimelineProps) {
  // Combine all history items into a single timeline
  const timelineItems = [
    ...child.addressHistory.map((item) => ({
      id: item.id,
      type: "address" as const,
      title: "Address Change",
      description: item.address,
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
    })),
    ...child.schoolHistory.map((item) => ({
      id: item.id,
      type: "school" as const,
      title: "School Change",
      description: `${item.schoolName}${item.grade ? ` - ${item.grade}` : ""}`,
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
    })),
    ...child.doctorHistory.map((item) => ({
      id: item.id,
      type: "doctor" as const,
      title: "Healthcare Provider Change",
      description: `${item.providerName}${item.providerType ? ` (${item.providerType})` : ""}`,
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime()
    const dateB = new Date(b.startDate).getTime()
    return dateB - dateA // Most recent first
  })

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">No history recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline for {child.firstName} {child.lastName}</CardTitle>
        <CardDescription>History of address, school, and healthcare provider changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          <div className="space-y-6">
            {timelineItems.map((item, index) => {
              const Icon = item.icon
              const isCurrent = item.isCurrent && !item.endDate

              return (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isCurrent
                        ? "bg-white border-blue-500"
                        : "bg-white border-gray-400"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 rounded-lg border p-4 ${item.bgColor} ${
                      isCurrent ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          {isCurrent && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Started: {format(new Date(item.startDate), "MMM d, yyyy")}
                          </span>
                          {item.endDate && (
                            <span>
                              Ended: {format(new Date(item.endDate), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
