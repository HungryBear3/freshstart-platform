"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MousePointerClick,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface MarketingStats {
  totals: {
    clicks: number
    signups: number
    conversions: number
    signupRate: string
    conversionRate: string
    revenue: number
  }
  bySource: Array<{
    source: string
    clicks: number
    signups: number
    conversions: number
    signupRate: string
    conversionRate: string
    revenue: number
    links: number
  }>
  byCampaign: Array<{
    campaign: string
    clicks: number
    signups: number
    conversions: number
    conversionRate: string
    revenue: number
    source: string
  }>
  topPerformers: Array<{
    name: string
    shortCode: string
    clicks: number
    signups: number
    conversions: number
    conversionRate: string
  }>
  period: {
    days: number
    startDate: string
  }
}

export default function AttributionDashboardPage() {
  const [stats, setStats] = useState<MarketingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30')

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/marketing-links/stats?days=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load attribution data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Marketing Attribution
          </h1>
          <p className="text-muted-foreground mt-1">
            Track conversions and ROI by marketing source
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button asChild>
            <Link href="/admin/marketing-links">
              Manage Links
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4" />
                  Total Clicks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(stats.totals.clicks)}</div>
                <p className="text-sm text-muted-foreground">
                  From all marketing links
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Signups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(stats.totals.signups)}</div>
                <p className="text-sm text-muted-foreground">
                  {stats.totals.signupRate}% of clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(stats.totals.conversions)}</div>
                <p className="text-sm text-muted-foreground">
                  {stats.totals.conversionRate}% of signups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(stats.totals.revenue)}</div>
                <p className="text-sm text-muted-foreground">
                  At $299/subscription
                </p>
              </CardContent>
            </Card>
          </div>

          {/* By Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Source</CardTitle>
                <CardDescription>Click, signup, and conversion metrics by traffic source</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.bySource.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No data yet. Create marketing links to start tracking.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.bySource.map(source => (
                      <div key={source.source} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{source.source}</div>
                          <div className="text-sm text-muted-foreground">
                            {source.links} link{source.links !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{formatNumber(source.clicks)}</div>
                            <div className="text-muted-foreground">Clicks</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{formatNumber(source.signups)}</div>
                            <div className="text-muted-foreground">Signups</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{formatNumber(source.conversions)}</div>
                            <div className="text-muted-foreground">Conv.</div>
                          </div>
                          <div className="text-center min-w-[60px]">
                            <div className="font-medium text-green-600">{formatCurrency(source.revenue)}</div>
                            <div className="text-muted-foreground">Revenue</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Links with highest conversion rates (min 10 clicks)</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topPerformers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No links with 10+ clicks yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.topPerformers.slice(0, 5).map((link, index) => (
                      <div key={link.shortCode} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{link.name}</div>
                            <div className="text-sm text-muted-foreground">/go/{link.shortCode}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{link.conversions}</div>
                            <div className="text-muted-foreground">Conv.</div>
                          </div>
                          <div className="text-center min-w-[50px]">
                            <div className="font-medium text-green-600">{link.conversionRate}%</div>
                            <div className="text-muted-foreground">Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* By Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Campaign</CardTitle>
              <CardDescription>Track which campaigns are driving the most conversions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.byCampaign.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No campaign data yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Campaign</th>
                        <th className="text-left py-3 px-4 font-medium">Source</th>
                        <th className="text-right py-3 px-4 font-medium">Clicks</th>
                        <th className="text-right py-3 px-4 font-medium">Signups</th>
                        <th className="text-right py-3 px-4 font-medium">Conversions</th>
                        <th className="text-right py-3 px-4 font-medium">Conv. Rate</th>
                        <th className="text-right py-3 px-4 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byCampaign.map(campaign => (
                        <tr key={campaign.campaign} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{campaign.campaign}</td>
                          <td className="py-3 px-4 capitalize">{campaign.source}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(campaign.clicks)}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(campaign.signups)}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(campaign.conversions)}</td>
                          <td className="py-3 px-4 text-right">{campaign.conversionRate}%</td>
                          <td className="py-3 px-4 text-right text-green-600 font-medium">
                            {formatCurrency(campaign.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
