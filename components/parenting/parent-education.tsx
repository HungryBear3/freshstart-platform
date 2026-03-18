"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Search, Plus, CheckCircle2, MapPin, DollarSign, Globe } from "lucide-react"
import { format } from "date-fns"

export function ParentEducation() {
  const [providers, setProviders] = useState<any[]>([])
  const [completions, setCompletions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState({
    county: "",
    format: "",
    maxCost: "",
  })
  const [showAddCompletion, setShowAddCompletion] = useState(false)
  const [completionForm, setCompletionForm] = useState({
    providerId: "",
    completedAt: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    fetchProviders()
    fetchCompletions()
  }, [])

  const fetchProviders = async () => {
    try {
      const params = new URLSearchParams()
      if (searchFilters.county) params.append("county", searchFilters.county)
      if (searchFilters.format) params.append("format", searchFilters.format)
      if (searchFilters.maxCost) params.append("maxCost", searchFilters.maxCost)

      const response = await fetch(`/api/parent-education/providers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletions = async () => {
    try {
      const response = await fetch("/api/parent-education/completions")
      if (response.ok) {
        const data = await response.json()
        setCompletions(data.completions || [])
      }
    } catch (error) {
      console.error("Failed to fetch completions:", error)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchProviders()
  }

  const handleAddCompletion = async () => {
    try {
      const response = await fetch("/api/parent-education/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completionForm),
      })

      if (!response.ok) {
        throw new Error("Failed to add completion")
      }

      fetchCompletions()
      setShowAddCompletion(false)
      setCompletionForm({
        providerId: "",
        completedAt: new Date().toISOString().split("T")[0],
        notes: "",
      })
    } catch (error) {
      console.error("Error adding completion:", error)
      alert("Failed to add completion. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parent Education Providers</CardTitle>
          <CardDescription>
            Search for parent education providers in your county
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-4">
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={searchFilters.county}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, county: e.target.value })
                }
                placeholder="e.g., Cook"
              />
            </div>

            <div>
              <Label htmlFor="format">Format</Label>
              <Select
                value={searchFilters.format}
                onValueChange={(value) =>
                  setSearchFilters({ ...searchFilters, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Formats</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxCost">Max Cost</Label>
              <Input
                id="maxCost"
                type="number"
                value={searchFilters.maxCost}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, maxCost: e.target.value })
                }
                placeholder="e.g., 100"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading providers...</p>
          ) : providers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No providers found</p>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{provider.name}</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {provider.county} County
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {provider.format.charAt(0).toUpperCase() + provider.format.slice(1)}
                          </div>
                          {provider.cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              ${provider.cost.toFixed(2)}
                            </div>
                          )}
                          {provider.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                          {provider.description && (
                            <p className="mt-2 text-gray-700">{provider.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Education Completions</CardTitle>
              <CardDescription>
                Track your parent education course completions
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddCompletion(!showAddCompletion)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Completion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddCompletion && (
            <div className="mb-6 p-4 border rounded-lg space-y-4">
              <div>
                <Label htmlFor="providerId">Provider</Label>
                <Select
                  value={completionForm.providerId}
                  onValueChange={(value) =>
                    setCompletionForm({ ...completionForm, providerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="completedAt">Completion Date</Label>
                <Input
                  id="completedAt"
                  type="date"
                  value={completionForm.completedAt}
                  onChange={(e) =>
                    setCompletionForm({ ...completionForm, completedAt: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={completionForm.notes}
                  onChange={(e) =>
                    setCompletionForm({ ...completionForm, notes: e.target.value })
                  }
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  placeholder="Additional notes about the course..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddCompletion}>Save Completion</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddCompletion(false)
                    setCompletionForm({
                      providerId: "",
                      completedAt: new Date().toISOString().split("T")[0],
                      notes: "",
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {completions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No completions recorded yet</p>
          ) : (
            <div className="space-y-4">
              {completions.map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{completion.provider.name}</h3>
                    <p className="text-sm text-gray-600">
                      Completed: {format(new Date(completion.completedAt), "MMM d, yyyy")}
                    </p>
                    {completion.notes && (
                      <p className="text-sm text-gray-600 mt-1">{completion.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
