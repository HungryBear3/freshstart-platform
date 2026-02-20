"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PARENTING_PLAN_TEMPLATES } from "@/lib/parenting/templates"
import { CheckCircle2 } from "lucide-react"

interface ParentingPlanTemplatesProps {
  onSelectTemplate: (template: any) => void
  selectedTemplateId?: string
}

export function ParentingPlanTemplates({
  onSelectTemplate,
  selectedTemplateId,
}: ParentingPlanTemplatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parenting Plan Templates</CardTitle>
        <CardDescription>
          Choose a common parenting arrangement template to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PARENTING_PLAN_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedTemplateId === template.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {template.arrangement}
                      </span>
                    </div>
                  </div>
                  {selectedTemplateId === template.id && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant={selectedTemplateId === template.id ? "default" : "outline"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectTemplate(template)
                  }}
                >
                  {selectedTemplateId === template.id ? "Selected" : "Use This Template"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
