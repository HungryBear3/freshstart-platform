import Link from "next/link"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ChildSupportCalculatorPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl py-12">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Child-support calculator unavailable</CardTitle>
            <CardDescription>Formula validation in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p>
              This calculator has been disabled while its formulas, source data,
              and legal boundaries are independently validated. Do not rely on a
              prior result for a filing or support decision.
            </p>
            <p>
              Use current official Illinois resources or consult a qualified
              attorney for a case-specific calculation.
            </p>
            <Button asChild>
              <Link href="/legal">Review general legal information</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
