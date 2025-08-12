"use client"

import * as React from "react"
import {
  Label as AriaLabel,
  Group,
  FieldError as AriaFieldError,
  Text,
} from "react-aria-components"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof AriaLabel>,
  React.ComponentPropsWithoutRef<typeof AriaLabel>
>(({ className, ...props }, ref) => (
  <AriaLabel
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

const FieldGroup = React.forwardRef<
  React.ElementRef<typeof Group>,
  React.ComponentPropsWithoutRef<typeof Group>
>(({ className, ...props }, ref) => (
  <Group
    ref={ref}
    className={cn(
      "relative flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background text-sm",
      "focus-within:ring-1 focus-within:ring-ring",
      className
    )}
    {...props}
  />
))
FieldGroup.displayName = "FieldGroup"

const FieldError = React.forwardRef<
  React.ElementRef<typeof AriaFieldError>,
  React.ComponentPropsWithoutRef<typeof AriaFieldError>
>(({ className, children, ...props }, ref) => {
  if (typeof children === 'function') {
    return (
      <AriaFieldError
        ref={ref}
        className={cn("text-sm text-destructive", className)}
        {...props}
      >
        {children}
      </AriaFieldError>
    )
  }
  
  return (
    <AriaFieldError
      ref={ref}
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {children || ((validation: { validationErrors: string[] }) => validation.validationErrors)}
    </AriaFieldError>
  )
})
FieldError.displayName = "FieldError"

export { Label, FieldGroup, FieldError }