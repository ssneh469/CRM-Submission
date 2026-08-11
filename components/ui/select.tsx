"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

type Option = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

type SelectContextValue = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  options: Option[]
  setOptions: (options: Option[]) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select")
  }
  return context
}

function extractText(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") return node
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node) && node.props?.children) {
    return extractText(node.props.children)
  }
  return node
}

function collectOptions(children: React.ReactNode): Option[] {
  const options: Option[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    if (child.type === SelectContent) {
      options.push(...collectOptions(child.props.children))
      return
    }

    if (child.type === SelectGroup) {
      options.push(...collectOptions(child.props.children))
      return
    }

    if (child.type === SelectItem) {
      options.push({
        value: String(child.props.value),
        label: extractText(child.props.children),
        disabled: Boolean(child.props.disabled),
      })
    }
  })

  return options
}

function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  placeholder,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  children?: React.ReactNode
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const [options, setOptions] = React.useState<Option[]>(() => collectOptions(children))

  React.useEffect(() => {
    setOptions(collectOptions(children))
  }, [children])

  const currentValue = value ?? internalValue

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [onValueChange, value],
  )

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      defaultValue,
      onValueChange: handleValueChange,
      disabled,
      placeholder,
      options,
      setOptions,
    }),
    [currentValue, defaultValue, disabled, handleValueChange, options, placeholder],
  )

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>
}

function SelectGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-group" className={cn("scroll-my-1 p-1", className)} {...props} />
}

function SelectValue({ className, children, ...props }: React.ComponentProps<"span">) {
  const { value, placeholder, options } = useSelectContext()
  const label = options.find((option) => option.value === value)?.label

  return (
    <span data-slot="select-value" className={cn("flex flex-1 text-left", className)} {...props}>
      {label ?? children ?? placeholder ?? "Select an option"}
    </span>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  size?: "sm" | "default"
}) {
  const { value, onValueChange, disabled, options } = useSelectContext()

  return (
    <div
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "relative flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
    >
      <select
        aria-label={props["aria-label"] ?? props.id}
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onValueChange?.(event.target.value)}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      >
        {options.length === 0 ? (
          <option value="">No options</option>
        ) : (
          options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {typeof option.label === "string" ? option.label : String(option.value)}
            </option>
          ))
        )}
      </select>

      <span className="pointer-events-none flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {children}
      </span>

      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </div>
  )
}

function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-label" className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)} {...props} />
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  return (
    <div
      data-slot="select-item"
      className={cn("relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none", className)}
      {...props}
    >
      {children}
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center text-primary">
        <CheckIcon className="size-4" />
      </span>
    </div>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-separator" className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)} {...props} />
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" data-slot="select-scroll-up-button" className={cn("top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <ChevronUpIcon />
    </button>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" data-slot="select-scroll-down-button" className={cn("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <ChevronDownIcon />
    </button>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
