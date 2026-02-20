"use client"

import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Breadcrumb } from "@/components/navigation/breadcrumb"
import { useState } from "react"
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export default function PreviewPage() {
  const [progress, setProgress] = useState(45)

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Preview", href: "/preview" },
            ]}
          />
          <h1 className="mt-4 text-4xl font-bold text-gray-900">
            UI Component Preview
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Preview of all UI components in the FreshStart IL design system
          </p>
        </div>

        <div className="space-y-12">
          {/* Buttons */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button>Default Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4">
              <Button disabled>Disabled Button</Button>
            </div>
          </section>

          {/* Form Elements */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Form Elements</h2>
            <div className="max-w-md space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="disabled">Disabled Input</Label>
                <Input
                  id="disabled"
                  disabled
                  placeholder="Disabled input"
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* Cards */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>
                    This is a default card with header and content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Card content goes here. This can contain any type of content.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Card</CardTitle>
                  <CardDescription>
                    Showcase features or information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Feature one</li>
                    <li>• Feature two</li>
                    <li>• Feature three</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Highlighted Card</CardTitle>
                  <CardDescription className="text-blue-700">
                    Special emphasis card
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800">
                    This card has special styling to draw attention.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Alerts</h2>
            <div className="space-y-4 max-w-2xl">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This is an informational alert message.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your action was completed successfully!
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Please review this information before proceeding.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Progress & Loading */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Progress & Loading</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label className="mb-2 block">Progress Bar ({progress}%)</Label>
                <Progress value={progress} />
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    -10%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    +10%
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Loading Spinners</Label>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-xs text-gray-600">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="md" />
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" />
                    <span className="text-xs text-gray-600">Large</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Skeleton Loading</Label>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Preview */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Navigation</h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Breadcrumb Navigation</Label>
                <Breadcrumb
                  items={[
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Profile" },
                  ]}
                />
              </div>
              <p className="text-sm text-gray-600">
                Header and Footer are shown at the top and bottom of this page.
              </p>
            </div>
          </section>

          {/* Color Palette */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Color Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="h-24 bg-blue-600 rounded-lg mb-2"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-gray-600">Blue-600</p>
              </div>
              <div>
                <div className="h-24 bg-gray-100 rounded-lg mb-2"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-gray-600">Gray-100</p>
              </div>
              <div>
                <div className="h-24 bg-green-500 rounded-lg mb-2"></div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-xs text-gray-600">Green-500</p>
              </div>
              <div>
                <div className="h-24 bg-red-500 rounded-lg mb-2"></div>
                <p className="text-sm font-medium">Error</p>
                <p className="text-xs text-gray-600">Red-500</p>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Typography</h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
                <p className="text-sm text-gray-500 mt-1">Bold, 4xl (36px)</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
                <p className="text-sm text-gray-500 mt-1">Bold, 3xl (30px)</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Heading 3</h3>
                <p className="text-sm text-gray-500 mt-1">Semibold, 2xl (24px)</p>
              </div>
              <div>
                <p className="text-base text-gray-900">
                  Body text - Regular paragraph text. This is the default size for body content.
                </p>
                <p className="text-sm text-gray-500 mt-1">Base (16px)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Small text - Used for descriptions, captions, and secondary information.
                </p>
                <p className="text-xs text-gray-500 mt-1">Small (14px)</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
