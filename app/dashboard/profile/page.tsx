"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string | null
  emailVerified: Date | null
  createdAt: Date
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Profile update form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [updating, setUpdating] = useState(false)

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Delete account
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Subscription management
  const [subscription, setSubscription] = useState<{
    status: string
    plan: string
    trialEnd: string | null
    currentPeriodEnd: string | null
  } | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/stripe/sync", {
        method: "GET",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          setSubscription({
            status: data.subscription.status,
            plan: data.subscription.plan || "annual",
            trialEnd: data.subscription.trialEnd,
            currentPeriodEnd: data.subscription.currentPeriodEnd,
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        credentials: "include",
      })
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Failed to open subscription management")
        return
      }
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (err) {
      setError("Failed to open subscription management")
    } finally {
      setLoadingPortal(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/profile")
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signin")
          return
        }
        setError(data.error || "Failed to load profile")
        return
      }

      setUser(data.user)
      setName(data.user.name || "")
      setEmail(data.user.email)
    } catch (err) {
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setUpdating(true)

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update profile")
        return
      }

      setSuccess("Profile updated successfully")
      setUser(data.user)
      if (data.user.email !== email) {
        setSuccess("Profile updated. Please verify your new email address.")
      }
    } catch (err) {
      setError("Failed to update profile")
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to change password")
        return
      }

      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setDeleting(true)

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to delete account")
        setDeleting(false)
        return
      }

      // Sign out and redirect
      await signOut({ callbackUrl: "/" })
    } catch (err) {
      setError("Failed to delete account")
      setDeleting(false)
    }
  }

  const handleExportData = async () => {
    setError("")
    setSuccess("")
    setExporting(true)

    try {
      const response = await fetch("/api/auth/export-data")
      
      if (!response.ok) {
        setError("Failed to export data")
        setExporting(false)
        return
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `newstart-il-data-export-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess("Data exported successfully")
    } catch (err) {
      setError("Failed to export data")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {!user.emailVerified && (
                  <p className="mt-1 text-sm text-yellow-600">
                    Email not verified.{" "}
                    <Link
                      href="/auth/resend-verification"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Resend verification email
                    </Link>
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={updating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Subscription Management */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subscription
            </h2>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                    </p>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span className={
                        subscription.status === "active" ? "text-green-600 font-medium" :
                        subscription.status === "trialing" ? "text-blue-600 font-medium" :
                        subscription.status === "canceled" ? "text-red-600 font-medium" :
                        "text-gray-600"
                      }>
                        {subscription.status === "trialing" ? "Free Trial" : 
                         subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </p>
                    {subscription.status === "trialing" && subscription.trialEnd && (
                      <p className="text-sm text-gray-500">
                        Trial ends: {new Date(subscription.trialEnd).toLocaleDateString()}
                      </p>
                    )}
                    {subscription.status === "active" && subscription.currentPeriodEnd && (
                      <p className="text-sm text-gray-500">
                        Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === "active" || subscription.status === "trialing" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {subscription.status === "active" || subscription.status === "trialing" ? "Active" : "Inactive"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loadingPortal ? "Loading..." : "Manage Subscription"}
                </button>
                <p className="text-xs text-gray-500">
                  Update payment method, view invoices, or cancel subscription
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  No active subscription found.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  View Plans
                </Link>
              </div>
            )}
          </div>

          {/* Data Export */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Data Export
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Download all your data in JSON format for privacy compliance (GDPR, CCPA, Illinois privacy laws).
            </p>
            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export My Data"}
            </button>
          </div>

          {/* Change Password */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="rounded-lg bg-white p-6 shadow border-2 border-red-200">
            <h2 className="text-xl font-semibold text-red-900 mb-4">
              Delete Account
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
            </p>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700">
                    Enter your password to confirm
                  </label>
                  <input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={deleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword("")
                    }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
