"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Define a more generic type for the items
interface ComboboxItem {
  value: string;
  label: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  className?: string;
  // Allow custom value input
  allowCustomValue?: boolean;
  // Add specific class names for trigger and content
  triggerClassName?: string; 
  contentClassName?: string;
  customValueInput?: string;
  onCustomValueInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomValueSubmit?: () => void; // Optional: if you want to handle submit explicitly
  disabled?: boolean; // Add disabled prop
}

export function Combobox({ 
  items, 
  value, 
  onValueChange, 
  placeholder = "Select item...", 
  searchPlaceholder = "Search item...",
  notFoundMessage = "No item found.",
  className,
  allowCustomValue = false,
  // We won't use customValueInput, onCustomValueInputChange, onCustomValueSubmit directly here
  // Instead, the parent component will manage the input state if allowCustomValue is true
  triggerClassName, // Get the prop
  contentClassName, // Get the prop
  disabled = false, // Add disabled prop with default value
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // If allowing custom value, the parent's 'value' state holds the custom input
  const displayValue = allowCustomValue 
    ? value 
    : items.find((item) => item.value.toLowerCase() === value?.toLowerCase())?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          // Apply triggerClassName here, falling back to className if triggerClassName not provided
          className={cn("w-[200px] justify-between", triggerClassName || className)} 
          disabled={disabled} // Also apply to Button for good measure, PopoverTrigger should handle it
        >
          {value ? displayValue : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* Apply contentClassName here, falling back to className if contentClassName not provided */}
      <PopoverContent className={cn("p-0 w-auto min-w-[250px]", contentClassName || className)}> 
        <Command filter={(itemValue, search) => {
            // Find the corresponding item label for filtering
            const itemLabel = items.find(item => item.value.toLowerCase() === itemValue.toLowerCase())?.label;
            // Check if search term is in label or value
            if (itemLabel?.toLowerCase().includes(search.toLowerCase())) return 1;
            if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
        }}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            // If allowing custom value, connect input change directly to parent's handler
            // The parent component should manage the state for the custom input
            {...(allowCustomValue && {
              value: value, // Show the current custom value in search
              onValueChange: onValueChange // Update parent state on search input change
            })}
            disabled={disabled} // Disable CommandInput as well
          />
          <CommandList>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value} // Use item.value for internal matching
                  onSelect={(currentValue) => {
                    if (disabled) return; // Prevent selection if disabled
                    // currentValue will be the item.value that was selected
                    onValueChange(currentValue === value.toLowerCase() ? "" : currentValue) // Use lower case for comparison stability
                    setOpen(false)
                  }}
                  className="text-lg"
                  disabled={disabled} // Disable CommandItem
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === item.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Note: This version integrates the custom value logic more directly.
// The parent component needs to manage the 'value' state which doubles as the custom input state when allowCustomValue is true.
// The onValueChange prop will be called for both selection and custom input typing. 