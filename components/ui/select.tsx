"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

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
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
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
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    setOptions(collectOptions(children))
  }, [children])

  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (contentRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const currentValue = value ?? internalValue

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue)
      }
      onValueChange?.(nextValue)
      setOpen(false)
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
      open,
      setOpen,
      triggerRef,
      contentRef,
    }),
    [currentValue, defaultValue, disabled, handleValueChange, open, options, placeholder],
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
  const { disabled, open, setOpen, triggerRef } = useSelectContext()

  return (
    <button
      ref={triggerRef}
      type="button"
      data-slot="select-trigger"
      data-size={size}
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      <span className="pointer-events-none flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {children}
      </span>
      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </button>
  )
}

function SelectContent({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { open, triggerRef, contentRef } = useSelectContext()
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, triggerRef])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={contentRef}
      data-slot="select-content"
      className={cn(
        "fixed z-50 max-h-(--available-height) min-w-36 overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
        className,
      )}
      style={{ top: position.top, left: position.left, width: position.width }}
      role="listbox"
    >
      {children}
    </div>,
    document.body,
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-label" className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)} {...props} />
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const { value: selectedValue, onValueChange } = useSelectContext()
  const selected = selectedValue === value

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-slot="select-item"
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-2 text-left text-sm outline-none select-none transition-colors focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        selected && "bg-accent text-accent-foreground",
        className,
      )}
      onClick={() => {
        if (!disabled) onValueChange?.(value)
      }}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">{children}</span>
      {selected && <CheckIcon className="size-4 shrink-0 text-primary" />}
    </button>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-separator" className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)} {...props} />
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" data-slot="select-scroll-up-button" className={cn("flex w-full items-center justify-center bg-popover py-1 text-muted-foreground", className)} {...props}>
      <ChevronUpIcon className="size-4" />
    </button>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" data-slot="select-scroll-down-button" className={cn("flex w-full items-center justify-center bg-popover py-1 text-muted-foreground", className)} {...props}>
      <ChevronDownIcon className="size-4" />
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
