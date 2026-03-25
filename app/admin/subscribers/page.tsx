"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, ArrowLeft, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Subscriber {
  id: string
  email: string
  source: string
  createdAt: string
}

interface SubscriberData {
  total: number
  subscribers: Subscriber[]
}

export default function SubscribersPage() {
  const [data, setData] = useState<SubscriberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/subscribers")
      if (!res.ok) throw new Error("Failed to load")
      setData(await res.json())
    } catch {
      setError("Failed to load subscribers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checklist Subscribers</h1>
        <Button variant="outline" size="sm" onClick={load} className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <>
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{data.total}</p>
            </CardContent>
          </Card>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signed Up</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.subscribers.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No subscribers yet</td></tr>
                )}
                {data.subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{s.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.source || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
