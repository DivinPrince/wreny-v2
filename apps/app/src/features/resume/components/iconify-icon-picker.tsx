import { useEffect, useState } from 'react'
import { defaultCustomFieldIcon } from '@repo/core/schemas'
import { ChevronsUpDown, Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'

import { cn } from '#/lib/utils'

import { getIconifyPath } from '../rendering/brand-icon'

/** Popular brand icons (simple-icons slugs) shown as quick picks. */
const PRESET_BRAND_ICONS = [
  'github',
  'linkedin',
  'x',
  'instagram',
  'youtube',
  'gitlab',
  'discord',
  'facebook',
  'threads',
  'mastodon',
  'medium',
  'devdotto',
  'stackoverflow',
  'tiktok',
  'twitch',
  'behance',
  'dribbble',
  'codepen',
  'codesandbox',
  'npm',
  'rss',
  'telegram',
  'whatsapp',
  'slack',
  'docker',
] as const

type IconifySearchResponse = {
  icons?: string[]
}

function iconifySvgUrl(iconId: string) {
  const path = iconId.includes(':')
    ? (() => {
        const [prefix, ...rest] = iconId.split(':')
        return `${prefix}/${rest.join(':')}`
      })()
    : getIconifyPath(iconId)
  if (!path) return ''
  return `https://api.iconify.design/${path}.svg`
}

type IconifyIconPickerProps = {
  id?: string
  value: string
  onChange: (slug: string) => void
  disabled?: boolean
  className?: string
}

export function IconifyIconPicker({
  id,
  value,
  onChange,
  disabled = false,
  className,
}: Readonly<IconifyIconPickerProps>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const res = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=48`,
          )
          const data = (await res.json()) as IconifySearchResponse
          if (cancelled) return
          setResults(Array.isArray(data.icons) ? data.icons : [])
        } catch {
          if (!cancelled) setResults([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [query, open])

  const display = value.trim() || defaultCustomFieldIcon
  const labelText = value.trim() ? value : 'Choose icon'

  function pick(slug: string) {
    onChange(slug)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setQuery('')
          setResults([])
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          id={id}
          className={cn('h-10 w-full justify-between gap-2 px-3 font-normal', className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <img
              alt=""
              className="size-4 shrink-0"
              src={iconifySvgUrl(display)}
            />
            <span className="truncate text-left text-sm">{labelText}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 gap-3 p-3" align="start">
        <div className="space-y-1.5">
          <Label htmlFor={id ? `${id}-search` : undefined} className="text-xs">
            Search icons
          </Label>
          <Input
            id={id ? `${id}-search` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. globe, mail, notion…"
            autoComplete="off"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {query.trim() ? (
            loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No icons found.</p>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {results.map((iconId) => (
                  <button
                    key={iconId}
                    type="button"
                    title={iconId}
                    onClick={() => pick(iconId)}
                    className={cn(
                      'm-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background hover:bg-muted',
                      value === iconId &&
                        'ring-2 ring-ring ring-offset-2 ring-offset-popover',
                    )}
                  >
                    <img alt="" className="size-5" src={iconifySvgUrl(iconId)} />
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Popular brands</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_BRAND_ICONS.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    title={slug}
                    onClick={() => pick(slug)}
                    className={cn(
                      'm-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background hover:bg-muted',
                      value === slug &&
                        'ring-2 ring-ring ring-offset-2 ring-offset-popover',
                    )}
                  >
                    <img alt="" className="size-5" src={iconifySvgUrl(slug)} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
