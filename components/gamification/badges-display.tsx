"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BADGE_DEFINITIONS, type BadgeId } from "@/lib/badges/badge-definitions"
import { cn } from "@/lib/utils"

interface BadgesDisplayProps {
  earnedBadgeIds: string[]
  className?: string
}

export function BadgesDisplay({ earnedBadgeIds, className }: BadgesDisplayProps) {
  const allBadges = Object.values(BADGE_DEFINITIONS)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {allBadges.map((badge) => {
            const earned = earnedBadgeIds.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2",
                  earned
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-200 bg-gray-50/50 opacity-60"
                )}
                title={badge.description}
              >
                <span className="text-xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {badge.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
