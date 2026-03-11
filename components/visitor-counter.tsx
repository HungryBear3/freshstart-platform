"use client"

import { useEffect, useState } from "react"
import { Users } from "lucide-react"

interface VisitorCounterProps {
  className?: string
  showToday?: boolean
}

export function VisitorCounter({ className = "", showToday = false }: VisitorCounterProps) {
  const [count, setCount] = useState<number | null>(null)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracked, setTracked] = useState(false)

  // Track visit and fetch count on mount
  useEffect(() => {
    const trackAndFetch = async () => {
      try {
        // Check if we've already tracked this session
        const sessionKey = "visitor_tracked"
        const hasTracked = sessionStorage.getItem(sessionKey)

        if (!hasTracked) {
          console.log("[VisitorCounter] Tracking new visitor...")
          // Track the visit
          const trackResponse = await fetch("/api/visitors", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })

          console.log("[VisitorCounter] POST response status:", trackResponse.status)
          
          if (trackResponse.ok) {
            const trackData = await trackResponse.json()
            console.log("[VisitorCounter] Tracking response data:", trackData)
            setCount(trackData.total ?? 0)
            setTodayCount(trackData.today ?? 0)
            sessionStorage.setItem(sessionKey, "true")
            setTracked(true)
          } else {
            const errorText = await trackResponse.text()
            console.error("[VisitorCounter] Tracking failed:", trackResponse.status, errorText)
            // Still fetch count even if tracking fails
            const fetchResponse = await fetch("/api/visitors")
            if (fetchResponse.ok) {
              const fetchData = await fetchResponse.json()
              console.log("[VisitorCounter] Fetched count after failed tracking:", fetchData)
              setCount(fetchData.total ?? 0)
              setTodayCount(fetchData.today ?? 0)
            }
          }
        } else {
          console.log("[VisitorCounter] Already tracked this session, fetching count...")
          // Just fetch the count without tracking
          const fetchResponse = await fetch("/api/visitors")
          if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json()
            console.log("[VisitorCounter] Fetched count:", fetchData)
            setCount(fetchData.total ?? 0)
            setTodayCount(fetchData.today ?? 0)
          }
        }
      } catch (error) {
        console.error("Error tracking visitor:", error)
        // Try to fetch count even if tracking fails
        try {
          const fetchResponse = await fetch("/api/visitors")
          if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json()
            setCount(fetchData.total ?? 0)
            setTodayCount(fetchData.today ?? 0)
          } else {
            // If fetch fails, set to 0 so component still renders
            setCount(0)
            setTodayCount(0)
          }
        } catch (fetchError) {
          console.error("Error fetching visitor count:", fetchError)
          // Set to 0 so component still renders
          setCount(0)
          setTodayCount(0)
        }
      } finally {
        setLoading(false)
      }
    }

    trackAndFetch()
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Users className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  // Show 0 if count is null (API failed or no data yet)
  const displayCount = count ?? 0
  const displayToday = todayCount ?? 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Users className="h-4 w-4 text-blue-600" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {displayCount.toLocaleString()} {displayCount === 1 ? "visitor" : "visitors"}
        </span>
        {showToday && (
          <span className="text-xs text-gray-500">
            {displayToday.toLocaleString()} today
          </span>
        )}
      </div>
    </div>
  )
}
