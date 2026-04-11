import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'

export type SectionChromeValues = {
  name: string
  visible: boolean
  columns: number
  separateLinks: boolean
}

type SectionChromeSettingsProps = Readonly<{
  values: SectionChromeValues
  onChange: (next: SectionChromeValues) => void
  showSeparateLinks?: boolean
  className?: string
}>

export function SectionChromeSettings({
  values,
  onChange,
  showSeparateLinks = true,
  className,
}: SectionChromeSettingsProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className={cn('rounded-xl border border-border bg-muted/20', className)}>
      <Button
        type="button"
        variant="ghost"
        className="flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-medium"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Section display
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', open ? 'rotate-180' : '')}
        />
      </Button>
      {open ? (
        <div id={panelId} className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="section-chrome-name">Section title</Label>
            <Input
              id="section-chrome-name"
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              placeholder="Shown in the resume"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-chrome-columns">Columns</Label>
            <Input
              id="section-chrome-columns"
              type="number"
              min={1}
              max={5}
              value={values.columns}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (!Number.isFinite(n)) return
                onChange({ ...values, columns: Math.min(5, Math.max(1, n)) })
              }}
            />
          </div>
          <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${panelId}-visible`}
                checked={values.visible}
                onCheckedChange={(c) => onChange({ ...values, visible: c === true })}
              />
              <Label htmlFor={`${panelId}-visible`} className="cursor-pointer text-sm font-normal">
                Visible on resume
              </Label>
            </div>
            {showSeparateLinks ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${panelId}-separate-links`}
                  checked={values.separateLinks}
                  onCheckedChange={(c) =>
                    onChange({ ...values, separateLinks: c === true })
                  }
                />
                <Label htmlFor={`${panelId}-separate-links`} className="cursor-pointer text-sm font-normal">
                  Separate links
                </Label>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
