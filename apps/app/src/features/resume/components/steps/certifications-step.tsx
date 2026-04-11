import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import type { Certification } from '@repo/core/schemas'
import { defaultCertification } from '@repo/core/schemas'
import { EllipsisVertical, GripVertical, Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { MonthPicker } from '#/components/ui/month-picker'
import { MarkdownTextarea } from '#/components/ui/markdown-textarea'

import { cloneResumeDocument } from '../../lib/queries'
import {
  formatDateRange,
  generateEditorId,
  parseDateRange,
  sanitizeOptionalUrl,
  toMarkdownForForm,
  toMarkdownForStorage,
} from '../editor-utils'
import { SectionChromeSettings } from '../section-chrome-settings'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

type FormState = {
  name: string
  issuer: string
  startDate: string
  endDate: string
  isCurrent: boolean
  summary: string
  url: string
}

function empty(): Certification {
  return { ...defaultCertification, id: generateEditorId() }
}

function toForm(item: Certification): FormState {
  const range = parseDateRange(item.date)
  return {
    name: item.name,
    issuer: item.issuer,
    startDate: range.start,
    endDate: range.end,
    isCurrent: range.isCurrent,
    summary: toMarkdownForForm(item.summary),
    url: item.url.href,
  }
}

function Row({
  item,
  selectedId,
  onSelect,
  onRemove,
}: Readonly<{
  item: Certification
  selectedId: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-full items-start gap-2 rounded-lg px-4 py-3 text-left transition-colors ${
        item.id === selectedId ? 'bg-muted/60' : 'hover:bg-muted/30'
      } ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="touch-none cursor-grab shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(item.id)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-semibold truncate">{item.name || 'Certification'}</p>
            <p className="text-sm text-muted-foreground truncate">{item.issuer}</p>
            {item.date.trim() ? (
              <p className="text-xs text-muted-foreground truncate">{item.date}</p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button type="button" size="icon-xs" variant="ghost" className="rounded-full shrink-0">
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onSelect(item.id)}>Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onRemove(item.id)}>
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </button>
    </div>
  )
}

export function CertificationsStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const section = resume.sections.certifications
  const [items, setItems] = useState(section.items)
  const [selectedId, setSelectedId] = useState(section.items[0]?.id ?? '')
  const [form, setForm] = useState<FormState>(() => toForm(section.items[0] ?? empty()))

  useEffect(() => {
    const next = resume.sections.certifications.items
    const fb = next[0]?.id ?? ''
    setItems(next)
    setSelectedId((c) => (next.some((i) => i.id === c) ? c : fb))
  }, [resume])

  useEffect(() => {
    setForm(toForm(items.find((i) => i.id === selectedId) ?? empty()))
  }, [items, selectedId])

  const selected = items.find((i) => i.id === selectedId) ?? null
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oi = items.findIndex((i) => i.id === active.id)
      const ni = items.findIndex((i) => i.id === over.id)
      if (oi >= 0 && ni >= 0) setItems(arrayMove(items, oi, ni))
    }
  }

  async function persist(nextItems: Certification[], nextSel: string) {
    const nextResume = cloneResumeDocument(resume)
    nextResume.sections.certifications.items = nextItems
    await saveResume({ resume: nextResume, title })
    setItems(nextItems)
    setSelectedId(nextSel)
  }

  async function saveCurrent() {
    if (!selected) return
    const next = items.map((item) =>
      item.id === selected.id
        ? {
            ...item,
            name: form.name.trim(),
            issuer: form.issuer.trim(),
            date: formatDateRange({
              start: form.startDate,
              end: form.endDate,
              isCurrent: form.isCurrent,
            }),
            summary: toMarkdownForStorage(form.summary),
            url: { ...item.url, href: sanitizeOptionalUrl(form.url) },
          }
        : item,
    )
    await persist(next, selected.id)
  }

  async function remove(id: string) {
    const next = items.filter((i) => i.id !== id)
    await persist(next, next[0]?.id ?? '')
  }

  return (
    <StepPanel className="gap-5">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Certifications</h2>
        <SectionChromeSettings
          values={{
            name: section.name,
            visible: section.visible,
            columns: section.columns,
            separateLinks: section.separateLinks,
          }}
          onChange={(v) => {
            void (async () => {
              const nextResume = cloneResumeDocument(resume)
              Object.assign(nextResume.sections.certifications, v)
              await saveResume({ resume: nextResume, title })
            })()
          }}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <aside className="flex flex-col border-r border-border pr-6 lg:pr-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Entries</h3>
            <Button
              type="button"
              size="icon"
              className="size-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={() => {
                const n = empty()
                setItems((c) => [...c, n])
                setSelectedId(n.id)
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="mt-3 space-y-1.5 overflow-y-auto">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Add a certification.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <Row
                        key={item.id}
                        item={item}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onRemove={remove}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
          <Button
            type="button"
            className="mt-5 w-full rounded-xl bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => void saveCurrent()}
            disabled={isSaving || !selected}
          >
            Save certifications
          </Button>
        </aside>

        <main>
          {selected ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-semibold">{form.name || 'New certification'}</h3>
                <Button type="button" variant="destructive" size="sm" onClick={() => void remove(selected.id)}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Issuer</Label>
                  <Input value={form.issuer} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cert-start-${selected.id}`}>Start date</Label>
                  <MonthPicker
                    id={`cert-start-${selected.id}`}
                    value={form.startDate}
                    onChange={(value) => setForm((f) => ({ ...f, startDate: value }))}
                    placeholder="Pick start month"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cert-end-${selected.id}`}>End date</Label>
                  <MonthPicker
                    id={`cert-end-${selected.id}`}
                    value={form.endDate}
                    onChange={(value) => setForm((f) => ({ ...f, endDate: value }))}
                    placeholder="Pick end month"
                    disabled={form.isCurrent}
                  />
                </div>
                <div className="flex items-center gap-3 py-1 md:col-span-2">
                  <span className="text-sm font-medium">No end date (still valid)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isCurrent}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        isCurrent: !current.isCurrent,
                        endDate: !current.isCurrent ? '' : current.endDate,
                      }))
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center overflow-hidden rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      form.isCurrent ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-1/2 block size-4 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${
                        form.isCurrent ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>URL</Label>
                  <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Summary</Label>
                  <MarkdownTextarea
                    value={form.summary}
                    onChange={(summary) => setForm((f) => ({ ...f, summary }))}
                    disabled={isSaving}
                    className="min-h-32 rounded-xl"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-sm text-muted-foreground">
              Select or add a certification.
            </div>
          )}
        </main>
      </div>
    </StepPanel>
  )
}
