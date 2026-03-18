"use client"

import * as React from "react"
import { X, BookOpen, FileText, Calendar, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const HELP_SECTIONS = [
  {
    id: "petition",
    title: "Petition questionnaire",
    icon: FileText,
    content:
      "Complete the petition questionnaire to generate your divorce petition. Answer all required questions about your marriage, grounds for divorce, and requested relief.",
  },
  {
    id: "case-info",
    title: "Case information",
    icon: Calendar,
    content:
      "Add your case details including court name, county, case number (if filed), and judge. This helps us tailor documents and deadlines to your situation.",
  },
  {
    id: "documents",
    title: "Document generation",
    icon: FileText,
    content:
      "After completing questionnaires, generate court-ready documents. You can edit and regenerate as needed before filing.",
  },
  {
    id: "general",
    title: "General guidance",
    icon: BookOpen,
    content:
      "FreshStart IL guides you through the Illinois divorce process. We provide questionnaires, document generation, and deadline tracking. For legal advice, consult an attorney.",
  },
] as const

interface HelpSidebarProps {
  open: boolean
  onClose: () => void
  section?: string
  className?: string
}

export function HelpSidebar({ open, onClose, section, className }: HelpSidebarProps) {
  const [activeSection, setActiveSection] = React.useState(section ?? "general")
  const active = HELP_SECTIONS.find((s) => s.id === activeSection) ?? HELP_SECTIONS[3]

  React.useEffect(() => {
    if (section) setActiveSection(section)
  }, [section])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] border-l border-gray-200 bg-white shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close help"
              className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <nav className="border-b border-gray-200 p-2">
            <ul className="space-y-1">
              {HELP_SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      activeSection === s.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    )}
                  >
                    <s.icon className="h-4 w-4 shrink-0" />
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex-1 overflow-auto p-4">
            <h3 className="mb-2 font-medium">{active.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {active.content}
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
