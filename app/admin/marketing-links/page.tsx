"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Link2, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  ArrowLeft,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface MarketingLink {
  id: string
  shortCode: string
  name: string
  targetUrl: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent?: string
  clicks: number
  signups: number
  conversions: number
  isActive: boolean
  createdAt: string
}

export default function MarketingLinksPage() {
  const [links, setLinks] = useState<MarketingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    utmSource: 'influencer',
    utmMedium: 'referral',
    utmCampaign: '',
    utmContent: '',
  })

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/marketing-links')
      if (!response.ok) throw new Error('Failed to fetch links')
      const data = await response.json()
      setLinks(data.links)
    } catch (err) {
      setError('Failed to load marketing links')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleCreateLink = async () => {
    setCreating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/marketing-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create link')
      }
      
      await fetchLinks()
      setShowCreateDialog(false)
      setFormData({
        name: '',
        shortCode: '',
        utmSource: 'influencer',
        utmMedium: 'referral',
        utmCampaign: '',
        utmContent: '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return
    
    try {
      const response = await fetch(`/api/admin/marketing-links?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete link')
      
      await fetchLinks()
    } catch (err) {
      setError('Failed to delete link')
      console.error(err)
    }
  }

  const copyToClipboard = (shortCode: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const url = `${baseUrl}/go/${shortCode}`
    navigator.clipboard.writeText(url)
    setCopiedId(shortCode)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const generateShortCode = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const sourceOptions = [
    { value: 'influencer', label: 'Influencer' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'google', label: 'Google' },
    { value: 'email', label: 'Email' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'other', label: 'Other' },
  ]

  const mediumOptions = [
    { value: 'referral', label: 'Referral' },
    { value: 'cpc', label: 'Paid (CPC)' },
    { value: 'organic_social', label: 'Organic Social' },
    { value: 'video', label: 'Video' },
    { value: 'email', label: 'Email' },
    { value: 'affiliate', label: 'Affiliate' },
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin/attribution" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Attribution Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Link2 className="h-8 w-8 text-primary" />
            Marketing Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage trackable links for campaigns and influencers
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={fetchLinks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Marketing Link</DialogTitle>
                <DialogDescription>
                  Generate a trackable short link for a campaign or influencer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Link Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Jane Doe Influencer"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        shortCode: generateShortCode(e.target.value),
                      })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shortCode">Short Code</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/go/</span>
                    <Input
                      id="shortCode"
                      placeholder="jane-doe"
                      value={formData.shortCode}
                      onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Letters, numbers, hyphens, and underscores only
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={formData.utmSource}
                      onValueChange={(value) => setFormData({ ...formData, utmSource: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Medium</Label>
                    <Select
                      value={formData.utmMedium}
                      onValueChange={(value) => setFormData({ ...formData, utmMedium: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mediumOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="campaign">Campaign Name</Label>
                  <Input
                    id="campaign"
                    placeholder="e.g., launch_2026, divorce_tips"
                    value={formData.utmCampaign}
                    onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content (Optional)</Label>
                  <Input
                    id="content"
                    placeholder="e.g., video_title, ad_version_a"
                    value={formData.utmContent}
                    onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use to differentiate ads or content within the same campaign
                  </p>
                </div>

                {error && (
                  <div className="text-destructive text-sm">{error}</div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLink} disabled={creating || !formData.name || !formData.shortCode || !formData.utmCampaign}>
                  {creating ? 'Creating...' : 'Create Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && !showCreateDialog && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Marketing Links</CardTitle>
          <CardDescription>
            {links.length} link{links.length !== 1 ? 's' : ''} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && links.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">No marketing links yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first link to start tracking conversions
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Link
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Short URL</th>
                    <th className="text-left py-3 px-4 font-medium">Source</th>
                    <th className="text-left py-3 px-4 font-medium">Campaign</th>
                    <th className="text-right py-3 px-4 font-medium">Clicks</th>
                    <th className="text-right py-3 px-4 font-medium">Signups</th>
                    <th className="text-right py-3 px-4 font-medium">Conv.</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map(link => (
                    <tr key={link.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{link.name}</div>
                        {link.utmContent && (
                          <div className="text-xs text-muted-foreground">{link.utmContent}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          /go/{link.shortCode}
                        </code>
                      </td>
                      <td className="py-3 px-4 capitalize">{link.utmSource}</td>
                      <td className="py-3 px-4">{link.utmCampaign}</td>
                      <td className="py-3 px-4 text-right">{link.clicks}</td>
                      <td className="py-3 px-4 text-right">{link.signups}</td>
                      <td className="py-3 px-4 text-right">{link.conversions}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(link.shortCode)}
                          >
                            {copiedId === link.shortCode ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Common Sources</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>influencer</code> - Influencer partnerships</li>
                <li><code>youtube</code> - YouTube videos</li>
                <li><code>tiktok</code> - TikTok content</li>
                <li><code>instagram</code> - Instagram posts/reels</li>
                <li><code>facebook</code> - Facebook ads/posts</li>
                <li><code>google</code> - Google Ads</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Common Mediums</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>cpc</code> - Paid advertising</li>
                <li><code>referral</code> - Influencer/partner referral</li>
                <li><code>organic_social</code> - Organic social posts</li>
                <li><code>video</code> - Video content</li>
                <li><code>email</code> - Email campaigns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
