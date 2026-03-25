import { prisma } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CreditCard, ClipboardList, TrendingUp } from "lucide-react"

export default async function AdminDashboardPage() {
  const [
    userCount,
    activeSubCount,
    trialCount,
    documentCount,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.count({ where: { status: "trialing" } }),
    prisma.document.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
        subscription: { select: { status: true, plan: true } },
      },
    }),
  ])

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, href: "/admin/users" },
    { label: "Active Subscriptions", value: activeSubCount, icon: CreditCard, href: "/admin/users" },
    { label: "Trial Users", value: trialCount, icon: TrendingUp, href: "/admin/users" },
    { label: "Documents Generated", value: documentCount, icon: FileText, href: null },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Overview of users, subscriptions, and activity.</p>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {href && (
                <Link href={href} className="text-sm text-blue-600 hover:underline">View all</Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Signups</h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentUsers.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No users yet</td></tr>
            )}
            {recentUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.subscription?.plan || "—"}</td>
                <td className="px-6 py-4 text-sm">
                  {u.subscription?.status ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.subscription.status === "active" ? "bg-green-100 text-green-700" :
                      u.subscription.status === "trialing" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {u.subscription.status}
                    </span>
                  ) : <span className="text-gray-400">none</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nav Links */}
      <div className="mt-8 flex flex-wrap gap-3">
        {[
          { href: "/admin/users", label: "All Users" },
          { href: "/admin/subscribers", label: "Checklist Subscribers" },
          { href: "/admin/attribution", label: "Attribution" },
          { href: "/admin/marketing-links", label: "Marketing Links" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            {label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
