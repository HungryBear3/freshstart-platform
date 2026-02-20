"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  type: "single" | "multiple"
  collapsible: boolean
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)
const AccordionItemContext = React.createContext<{ value: string } | undefined>(undefined)

interface AccordionProps {
  type?: "single" | "multiple"
  collapsible?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  children: React.ReactNode
  className?: string
}

export function Accordion({
  type = "single",
  collapsible = true,
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue)
  const value = controlledValue ?? internalValue

  const handleValueChange = React.useCallback(
    (newValue: string | undefined) => {
      const finalValue = collapsible && value === newValue ? undefined : newValue
      if (onValueChange) {
        onValueChange(finalValue)
      } else {
        setInternalValue(finalValue)
      }
    },
    [value, collapsible, onValueChange]
  )

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type, collapsible }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("border-b border-gray-200 last:border-b-0", className)} data-value={value}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext)
  const item = React.useContext(AccordionItemContext)
  
  if (!context || !item) {
    throw new Error("AccordionTrigger must be used within Accordion and AccordionItem")
  }

  const isOpen = context.value === item.value

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(item.value)}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-blue-600",
        className
      )}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ml-2",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const context = React.useContext(AccordionContext)
  const item = React.useContext(AccordionItemContext)
  
  if (!context || !item) {
    throw new Error("AccordionContent must be used within Accordion and AccordionItem")
  }

  const isOpen = context.value === item.value

  if (!isOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all pb-4",
        className
      )}
    >
      {children}
    </div>
  )
}
