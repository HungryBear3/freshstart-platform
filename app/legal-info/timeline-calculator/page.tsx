"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Disclaimer } from "@/components/legal/disclaimer"
import { calculateTimeline, type TimelineInputs } from "@/lib/calculators/timeline"
import { ILLINOIS_COUNTIES } from "@/lib/calculators/constants"
import { Calendar, Clock, Info } from "lucide-react"
import { format } from "date-fns"

export default function TimelineCalculatorPage() {
  const [type, setType] = useState<"uncontested" | "contested">("uncontested")
  const [county, setCounty] = useState("Cook")
  const [hasChildren, setHasChildren] = useState(false)
  const [hasProperty, setHasProperty] = useState(false)
  const [hasComplexAssets, setHasComplexAssets] = useState(false)
  const [filingDate, setFilingDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  )

  const inputs: TimelineInputs = {
    type,
    county,
    hasChildren,
    hasProperty,
    hasComplexAssets,
    filingDate: new Date(filingDate),
  }

  const result = calculateTimeline(inputs)

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Divorce Timeline Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Estimate how long your Illinois divorce process will take based on your specific
            situation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Situation</CardTitle>
              <CardDescription>
                Answer these questions to get an estimated timeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Type of Divorce</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="uncontested"
                      checked={type === "uncontested"}
                      onChange={(e) => setType(e.target.value as "uncontested")}
                      className="h-4 w-4"
                    />
                    <span>Uncontested (both parties agree)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="contested"
                      checked={type === "contested"}
                      onChange={(e) => setType(e.target.value as "contested")}
                      className="h-4 w-4"
                    />
                    <span>Contested (disagreements to resolve)</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="county">County</Label>
                <select
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {ILLINOIS_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="filingDate">Expected Filing Date</Label>
                <Input
                  id="filingDate"
                  type="date"
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Children involved (custody/parenting time considerations)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasProperty}
                    onChange={(e) => setHasProperty(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Property to divide (real estate, vehicles, etc.)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasComplexAssets}
                    onChange={(e) => setHasComplexAssets(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Complex assets (businesses, investments, retirement accounts)</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Estimated Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Estimated Completion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {format(result.estimatedCompletion, "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Approximately {Math.round(result.estimatedDays / 30)} months (
                    {result.estimatedDays} days)
                  </p>
                </div>

                {result.factors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Factors Affecting Timeline:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Key Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        {index < result.milestones.length - 1 && (
                          <div className="h-full w-0.5 bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900">{milestone.name}</p>
                        <p className="text-sm text-gray-600">
                          {format(milestone.estimatedDate, "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Info className="h-5 w-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p>
                • These timelines are estimates based on typical Illinois divorce proceedings.
                Actual timelines may vary.
              </p>
              <p>
                • Court schedules, attorney availability, and case complexity can significantly
                affect timelines.
              </p>
              <p>
                • Contested divorces can take much longer if they go to trial or require extensive
                discovery.
              </p>
              <p>
                • Working with an attorney may help expedite the process in some cases, but can
                also add time if negotiations are complex.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Disclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
