"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  defaultValue?: string
  disabled?: boolean
  className?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onValueChange, children, defaultValue, disabled, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || value || "")
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    const currentValue = value !== undefined ? value : internalValue

    // Extract SelectValue placeholder and SelectItems from children
    let placeholder = "Select..."
    const items: React.ReactElement[] = []
    
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const element = child as React.ReactElement<{ children?: React.ReactNode }>

      if (element.type === SelectTrigger) {
        // Look for SelectValue inside SelectTrigger
        React.Children.forEach(element.props.children, (grandChild) => {
          if (React.isValidElement(grandChild) && grandChild.type === SelectValue) {
            const gc = grandChild as React.ReactElement<{ placeholder?: string }>
            placeholder = gc.props.placeholder || placeholder
          }
        })
      } else if (element.type === SelectContent) {
        // Extract items from SelectContent
        React.Children.forEach(element.props.children, (item) => {
          if (React.isValidElement(item) && item.type === SelectItem) {
            items.push(item as React.ReactElement)
          }
        })
      }
    })

    return (
      <select
        ref={ref}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {items}
      </select>
    )
  }
)
Select.displayName = "Select"

// SelectTrigger is just a wrapper - doesn't render anything itself
const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    // This component is only used for structure extraction, doesn't render
    return null
  }
)
SelectTrigger.displayName = "SelectTrigger"

// SelectValue is just metadata - doesn't render
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return null
}

// SelectContent is just a wrapper - doesn't render anything itself
const SelectContent = ({ children }: { children: React.ReactNode }) => {
  // This component is only used for structure extraction, doesn't render
  return null
}

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  return (
    <option ref={ref} className={cn(className)} value={value} {...props}>
      {children}
    </option>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
