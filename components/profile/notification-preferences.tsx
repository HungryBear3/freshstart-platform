"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell } from "lucide-react"

interface NotificationPrefs {
  deadlineReminders: boolean
  marketingEmails: boolean
  documentNotifications: boolean
}

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/auth/notification-preferences", { credentials: "include" })
      .then((r) => r.json())
      .then(setPrefs)
      .catch(() => setPrefs({ deadlineReminders: true, marketingEmails: false, documentNotifications: true }))
  }, [])

  const handleChange = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/auth/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
        credentials: "include",
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!prefs) return null

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Notification Preferences
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Choose which emails you want to receive from FreshStart IL.
      </p>
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={prefs.deadlineReminders}
            onCheckedChange={(v) => handleChange("deadlineReminders", !!v)}
            disabled={saving}
          />
          <div>
            <span className="font-medium text-gray-900">Deadline reminders</span>
            <p className="text-sm text-gray-500">Emails when case deadlines are approaching</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={prefs.documentNotifications}
            onCheckedChange={(v) => handleChange("documentNotifications", !!v)}
            disabled={saving}
          />
          <div>
            <span className="font-medium text-gray-900">Document notifications</span>
            <p className="text-sm text-gray-500">When documents are generated or ready</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={prefs.marketingEmails}
            onCheckedChange={(v) => handleChange("marketingEmails", !!v)}
            disabled={saving}
          />
          <div>
            <span className="font-medium text-gray-900">Marketing emails</span>
            <p className="text-sm text-gray-500">Tips, updates, and promotional offers</p>
          </div>
        </label>
      </div>
      {saved && <p className="mt-2 text-sm text-green-600">Preferences saved.</p>}
    </div>
  )
}
