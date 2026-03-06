"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

interface GettingStartedChecklistProps {
  hasCompletedPetition: boolean
  hasCaseInfo: boolean
  hasGeneratedDocuments: boolean
}

export function GettingStartedChecklist({
  hasCompletedPetition,
  hasCaseInfo,
  hasGeneratedDocuments,
}: GettingStartedChecklistProps) {
  const items = [
    {
      done: hasCompletedPetition,
      label: "Complete Petition questionnaire",
      href: "/questionnaires",
    },
    {
      done: hasCaseInfo,
      label: "Add case info",
      href: "/dashboard/case",
    },
    {
      done: hasGeneratedDocuments,
      label: "Generate documents",
      href: "/documents",
    },
  ]

  return (
    <Card className="mb-6 border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Getting started</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.href} className="flex items-center gap-3">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <Link
                href={item.href}
                className={item.done ? "text-muted-foreground line-through" : "font-medium hover:underline"}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
