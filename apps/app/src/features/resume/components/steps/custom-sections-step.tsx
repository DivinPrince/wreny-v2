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
import { useEffect, useId, useMemo, useState } from 'react'
import type { CustomSection } from '@repo/core/schemas'
import { defaultCustomSection } from '@repo/core/schemas'
import { EllipsisVertical, GripVertical, Plus, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
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
import { ensureResumeSectionInLayout, formatSectionName } from '../../lib/resume-layout'
import {
  formatDateRange,
  generateEditorId,
  parseDateRange,
  sanitizeOptionalUrl,
  toMarkdownForForm,
  toMarkdownForStorage,
} from '../editor-utils'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

type FormState = {
  name: string
  description: string
  startDate: string
  endDate: string
  isCurrent: boolean
  location: string
  summary: string
  keywords: string
  url: string
}

function emptyItem(): CustomSection {
  return { ...defaultCustomSection, id: generateEditorId() }
}

function toForm(item: CustomSection): FormState {
  const range = parseDateRange(item.date)
  return {
    name: item.name,
    description: item.description,
    startDate: range.start,
    endDate: range.end,
    isCurrent: range.isCurrent,
    location: item.location,
    summary: toMarkdownForForm(item.summary),
    keywords: item.keywords.join(', '),
    url: item.url.href,
  }
}

function stripCustomFromLayout(resume: ReturnType<typeof cloneResumeDocument>, customKey: string) {
  const token = `custom.${customKey}`
  resume.metadata.layout = resume.metadata.layout.map((page) =>
    page.map((col) => col.filter((s) => s !== token)),
  )
}

function Row({
  item,
  selectedId,
  onSelect,
  onRemove,
}: Readonly<{
  item: CustomSection
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
            <p className="font-semibold truncate">{item.name || 'Item'}</p>
            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
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

export function CustomSectionsStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const chromeIds = useId()
  const groupKeys = useMemo(() => Object.keys(resume.sections.custom).sort(), [resume.sections.custom])
  const [selectedGroupId, setSelectedGroupId] = useState(groupKeys[0] ?? '')
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    const keys = Object.keys(resume.sections.custom).sort()
    setSelectedGroupId((c) => (keys.includes(c) ? c : keys[0] ?? ''))
  }, [resume.sections.custom])

  const group = selectedGroupId ? resume.sections.custom[selectedGroupId] : undefined
  const [items, setItems] = useState<CustomSection[]>(group?.items ?? [])
  const [selectedItemId, setSelectedItemId] = useState(group?.items[0]?.id ?? '')
  const [form, setForm] = useState<FormState>(() => toForm(group?.items[0] ?? emptyItem()))

  useEffect(() => {
    const g = selectedGroupId ? resume.sections.custom[selectedGroupId] : undefined
    const next = g?.items ?? []
    const fb = next[0]?.id ?? ''
    setItems(next)
    setSelectedItemId((c) => (next.some((i) => i.id === c) ? c : fb))
  }, [resume, selectedGroupId])

  useEffect(() => {
    setForm(toForm(items.find((i) => i.id === selectedItemId) ?? emptyItem()))
  }, [items, selectedItemId])

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!selectedGroupId || !over || active.id === over.id) return
    const oi = items.findIndex((i) => i.id === active.id)
    const ni = items.findIndex((i) => i.id === over.id)
    if (oi >= 0 && ni >= 0) {
      const reordered = arrayMove(items, oi, ni)
      setItems(reordered)
      void persistGroupItems(reordered)
    }
  }

  async function persistGroupItems(nextItems: CustomSection[]) {
    if (!selectedGroupId) return
    const nextResume = cloneResumeDocument(resume)
    const g = nextResume.sections.custom[selectedGroupId]
    if (g) g.items = nextItems
    await saveResume({ resume: nextResume, title })
    setItems(nextItems)
  }

  async function saveItem() {
    if (!selectedGroupId || !selectedItem) return
    const next = items.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            name: form.name.trim(),
            description: form.description.trim(),
            date: formatDateRange({
              start: form.startDate,
              end: form.endDate,
              isCurrent: form.isCurrent,
            }),
            location: form.location.trim(),
            summary: toMarkdownForStorage(form.summary),
            keywords: form.keywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean),
            url: { ...item.url, href: sanitizeOptionalUrl(form.url) },
          }
        : item,
    )
    await persistGroupItems(next)
  }

  async function removeItem(id: string) {
    const next = items.filter((i) => i.id !== id)
    await persistGroupItems(next)
    setSelectedItemId(next[0]?.id ?? '')
  }

  async function updateGroupChrome(patch: Partial<typeof group>) {
    if (!selectedGroupId) return
    const nextResume = cloneResumeDocument(resume)
    const g = nextResume.sections.custom[selectedGroupId]
    if (g) Object.assign(g, patch)
    await saveResume({ resume: nextResume, title })
  }

  async function addGroup() {
    const label = newGroupName.trim()
    if (!label) return
    const base = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const id = `${base || 'section'}-${generateEditorId().slice(0, 8)}`
    const nextResume = cloneResumeDocument(resume)
    nextResume.sections.custom[id] = {
      id,
      name: label,
      columns: 1,
      separateLinks: true,
      visible: true,
      items: [],
    }
    ensureResumeSectionInLayout(nextResume, `custom.${id}`)
    await saveResume({ resume: nextResume, title })
    setSelectedGroupId(id)
    setNewGroupName('')
  }

  async function deleteGroup() {
    if (!selectedGroupId) return
    const nextResume = cloneResumeDocument(resume)
    stripCustomFromLayout(nextResume, selectedGroupId)
    delete nextResume.sections.custom[selectedGroupId]
    await saveResume({ resume: nextResume, title })
    const keys = Object.keys(nextResume.sections.custom).sort()
    setSelectedGroupId(keys[0] ?? '')
  }

  return (
    <StepPanel className="gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Custom sections</h2>
        <p className="text-sm text-muted-foreground">
          Extra section groups beyond the built-in resume blocks. Add them to the layout from the Document tab.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label>New section name</Label>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g. Speaking engagements"
          />
        </div>
        <Button type="button" onClick={() => void addGroup()} disabled={!newGroupName.trim() || isSaving}>
          <Plus className="size-4" />
          Add section
        </Button>
      </div>

      {groupKeys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No custom sections yet. Create one above.
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
          <aside className="flex flex-col gap-3 lg:border-r lg:border-border lg:pr-6">
            <p className="text-sm font-medium">Sections</p>
            <div className="flex flex-col gap-1">
              {groupKeys.map((key) => {
                const g = resume.sections.custom[key]
                const label = g?.name?.trim() || formatSectionName(`custom.${key}`)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedGroupId(key)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedGroupId === key
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {selectedGroupId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-2 text-destructive hover:text-destructive"
                onClick={() => void deleteGroup()}
                disabled={isSaving}
              >
                <Trash2 className="size-4" />
                Delete section
              </Button>
            ) : null}
          </aside>

          {group ? (
            <div className="flex min-h-0 flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Display name</Label>
                  <Input
                    value={group.name}
                    onChange={(e) => void updateGroupChrome({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Columns</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={group.columns}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (Number.isFinite(n)) {
                        void updateGroupChrome({ columns: Math.min(5, Math.max(1, n)) })
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${chromeIds}-visible`}
                      checked={group.visible}
                      onCheckedChange={(c) => void updateGroupChrome({ visible: c === true })}
                    />
                    <Label htmlFor={`${chromeIds}-visible`} className="cursor-pointer text-sm font-normal">
                      Visible
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${chromeIds}-separate-links`}
                      checked={group.separateLinks}
                      onCheckedChange={(c) => void updateGroupChrome({ separateLinks: c === true })}
                    />
                    <Label htmlFor={`${chromeIds}-separate-links`} className="cursor-pointer text-sm font-normal">
                      Separate links
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] gap-6 border-t border-border pt-5 md:grid-cols-[280px_minmax(0,1fr)]">
                <div className="flex flex-col border-r border-border pr-4 md:pr-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">Items</h3>
                    <Button
                      type="button"
                      size="icon"
                      className="size-8 rounded-full"
                      onClick={() => {
                        const n = emptyItem()
                        const next = [...items, n]
                        void persistGroupItems(next)
                        setSelectedItemId(n.id)
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items yet.</p>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-1.5">
                            {items.map((item) => (
                              <Row
                                key={item.id}
                                item={item}
                                selectedId={selectedItemId}
                                onSelect={setSelectedItemId}
                                onRemove={(id) => void removeItem(id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => void saveItem()}
                    disabled={isSaving || !selectedItem}
                  >
                    Save item
                  </Button>
                </div>

                <div>
                  {selectedItem ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-semibold">{form.name || 'Item'}</h3>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void removeItem(selectedItem.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Name</Label>
                          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`custom-item-start-${selectedItem.id}`}>Start date</Label>
                          <MonthPicker
                            id={`custom-item-start-${selectedItem.id}`}
                            value={form.startDate}
                            onChange={(value) => setForm((f) => ({ ...f, startDate: value }))}
                            placeholder="Pick start month"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`custom-item-end-${selectedItem.id}`}>End date</Label>
                          <MonthPicker
                            id={`custom-item-end-${selectedItem.id}`}
                            value={form.endDate}
                            onChange={(value) => setForm((f) => ({ ...f, endDate: value }))}
                            placeholder="Pick end month"
                            disabled={form.isCurrent}
                          />
                        </div>
                        <div className="flex items-center gap-3 py-1 md:col-span-2">
                          <span className="text-sm font-medium">Ongoing (no end date)</span>
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
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={form.location}
                            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>URL</Label>
                          <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Keywords</Label>
                          <Input
                            value={form.keywords}
                            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                          />
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
                    <p className="text-sm text-muted-foreground">Select or add an item.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </StepPanel>
  )
}
