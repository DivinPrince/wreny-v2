"use client"

import { useState, useRef, useEffect } from 'react'
import { format, parse, isValid } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'

import { cn } from '#/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

/** Converts YYYY-MM string to { year, month } */
function parseValue(value: string): { year: number; month: number } | null {
  if (!value) return null
  const date = parse(value, 'yyyy-MM', new Date())
  return isValid(date)
    ? { year: date.getFullYear(), month: date.getMonth() }
    : null
}

/** Builds YYYY-MM from year and month index */
function toValue(year: number, month: number): string {
  return format(new Date(year, month, 1), 'yyyy-MM')
}

/** Formats YYYY-MM for display */
function formatDisplay(value: string): string {
  const parsed = parseValue(value)
  if (!parsed) return ''
  return `${MONTHS[parsed.month]} ${parsed.year}`
}

const MIN_YEAR = 1950
const MAX_YEAR = 2100

type MonthPickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

const CURRENT_YEAR = new Date().getFullYear()

export function MonthPicker({
  value,
  onChange,
  placeholder = 'Pick a month',
  disabled = false,
  id,
  className,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [yearInput, setYearInput] = useState('')
  const yearInputRef = useRef<HTMLInputElement>(null)
  const parsed = parseValue(value)
  const year = parsed?.year ?? CURRENT_YEAR
  const month = parsed?.month ?? -1
  const displayText = formatDisplay(value)

  useEffect(() => {
    if (open) {
      setYearInput(String(year))
    }
  }, [open, year])

  function handleSelect(newValue: string) {
    onChange(newValue)
    setOpen(false)
  }

  function getCurrentYear(): number {
    const fromInput = parseInt(yearInput, 10)
    return Number.isNaN(fromInput) ? year : fromInput
  }

  function applyYear(nextYear: number) {
    const clamped = Math.min(MAX_YEAR, Math.max(MIN_YEAR, nextYear))
    onChange(toValue(clamped, month >= 0 ? month : 0))
    setYearInput(String(clamped))
  }

  function handleYearBlur() {
    const num = parseInt(yearInput, 10)
    if (Number.isNaN(num)) {
      setYearInput(String(year))
      return
    }
    applyYear(num)
  }

  function handleYearKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      yearInputRef.current?.blur()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !displayText && 'text-muted-foreground',
            className,
          )}
        >
          <span>{displayText || placeholder}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full"
              onClick={() => applyYear(getCurrentYear() - 1)}
              aria-label="Previous year"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <input
              ref={yearInputRef}
              type="text"
              inputMode="numeric"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={handleYearBlur}
              onKeyDown={handleYearKeyDown}
              className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm font-semibold outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Year"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full"
              onClick={() => applyYear(getCurrentYear() + 1)}
              aria-label="Next year"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(toValue(getCurrentYear(), index))}
                className={cn(
                  'rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                  month === index
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                )}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
