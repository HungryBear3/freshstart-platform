"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Baby, Calendar, GraduationCap, AlertCircle } from "lucide-react"
import Link from "next/link"
import { ChildrenList } from "@/components/parenting/children-list"
import { ParentingPlanBuilder } from "@/components/parenting/parenting-plan-builder"
import { ParentEducation } from "@/components/parenting/parent-education"
import { ScheduleCalendar } from "@/components/parenting/schedule-calendar"

export default function ParentingToolsPage() {
  const [activeTab, setActiveTab] = useState("children")
  const [children, setChildren] = useState<any[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChildren()
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    try {
      const response = await fetch("/api/parenting-plan")
      if (response.ok) {
        const data = await response.json()
        setPlan(data)
      }
    } catch {
      // Plan is optional
    }
  }

  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/children")
      if (!response.ok) {
        throw new Error("Failed to fetch children")
      }
      const data = await response.json()
      setChildren(data.children || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load children")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parenting Tools</h1>
          <p className="mt-2 text-gray-600">
            Manage your children's information and create a parenting plan
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "children", label: "Children's Information", icon: Baby },
                { id: "parenting-plan", label: "Parenting Plan", icon: Calendar },
                { id: "calendar", label: "Schedule Calendar", icon: Calendar },
                { id: "parent-education", label: "Parent Education", icon: GraduationCap },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {activeTab === "children" && (
            <ChildrenList children={children} onUpdate={fetchChildren} />
          )}

          {activeTab === "parenting-plan" && (
            <ParentingPlanBuilder onPlanUpdate={fetchPlan} />
          )}

          {activeTab === "calendar" && (
            <div className="space-y-4">
              {(!plan?.weeklySchedule || Object.keys(plan.weeklySchedule || {}).length === 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Set up your weekly schedule in the Parenting Plan tab first. The calendar will show your parenting time once you define which parent has the children on each day.
                  </AlertDescription>
                </Alert>
              )}
              <ScheduleCalendar
                weeklySchedule={plan?.weeklySchedule || null}
                holidays={plan?.holidays || []}
                summerVacation={plan?.summerVacation || null}
                schoolBreaks={plan?.schoolBreaks || []}
              />
            </div>
          )}

          {activeTab === "parent-education" && (
            <ParentEducation />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
