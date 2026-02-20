"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Disclaimer } from "@/components/legal/disclaimer"
import {
  estimateCosts,
  getFeeWaiverInfo,
  type CostInputs,
} from "@/lib/calculators/cost-estimator"
import { ILLINOIS_COUNTIES } from "@/lib/calculators/constants"
import { DollarSign, Info, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CostEstimatorPage() {
  const [county, setCounty] = useState("Cook")
  const [type, setType] = useState<"uncontested" | "contested">("uncontested")
  const [hasChildren, setHasChildren] = useState(false)
  const [hasProperty, setHasProperty] = useState(false)
  const [needsServiceOfProcess, setNeedsServiceOfProcess] = useState(true)
  const [needsMediation, setNeedsMediation] = useState(false)

  const inputs: CostInputs = {
    county,
    type,
    hasChildren,
    hasProperty,
    needsServiceOfProcess,
    needsMediation,
  }

  const result = estimateCosts(inputs)
  const feeWaiverInfo = getFeeWaiverInfo()

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Divorce Cost Estimator
          </h1>
          <p className="text-lg text-gray-600">
            Estimate the costs associated with your Illinois divorce based on your specific
            situation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Situation</CardTitle>
              <CardDescription>
                Answer these questions to get a cost estimate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>County</Label>
                <select
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
                    <span>Uncontested</span>
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
                    <span>Contested</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Children involved</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasProperty}
                    onChange={(e) => setHasProperty(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Property to divide</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsServiceOfProcess}
                    onChange={(e) => setNeedsServiceOfProcess(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Need service of process</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsMediation}
                    onChange={(e) => setNeedsMediation(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Mediation required or desired</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Estimated Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Estimated Cost</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${result.total.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Court fees and required costs only
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown:</p>
                  <div className="space-y-2">
                    {result.breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.category}
                            {item.required && (
                              <span className="ml-2 text-xs text-red-600">Required</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 ml-4">
                          ${item.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.factors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Additional Considerations:
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

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Fee Waivers Available</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">{feeWaiverInfo.eligible}</p>
                <p className="text-xs">
                  <strong>Requirements:</strong> {feeWaiverInfo.requirements.join(", ")}
                </p>
                <p className="text-xs mt-1">
                  <strong>How to apply:</strong> {feeWaiverInfo.howToApply}
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="mt-8">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <AlertCircle className="h-5 w-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-800">
              <p>{result.disclaimer}</p>
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
