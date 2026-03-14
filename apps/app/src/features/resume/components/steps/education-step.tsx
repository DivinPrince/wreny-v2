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
import { useEffect, useMemo, useState } from 'react'
import type { Education } from '@repo/core/schemas'
import { defaultEducation } from '@repo/core/schemas'
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
import { Textarea } from '#/components/ui/textarea'

import { cloneResumeDocument } from '../../lib/queries'
import {
  formatDateRange,
  generateEditorId,
  htmlToPlainText,
  paragraphTextToHtml,
  parseDateRange,
  sanitizeOptionalUrl,
} from '../editor-utils'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

type EducationFormState = {
  institution: string
  studyType: string
  area: string
  score: string
  startDate: string
  endDate: string
  isCurrent: boolean
  summary: string
  url: string
}

function createEmptyEducation() {
  return {
    ...defaultEducation,
    id: generateEditorId(),
  }
}

function buildFormState(item: Education): EducationFormState {
  const range = parseDateRange(item.date)

  return {
    institution: item.institution,
    studyType: item.studyType,
    area: item.area,
    score: item.score,
    startDate: range.start,
    endDate: range.end,
    isCurrent: range.isCurrent,
    summary: htmlToPlainText(item.summary),
    url: item.url.href,
  }
}

function EducationSortableItem({
  item,
  selectedId,
  onSelect,
  onRemove,
}: Readonly<{
  item: Education
  selectedId: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-full items-start gap-2 rounded-lg px-4 py-3 text-left transition-colors ${
        item.id === selectedId
          ? 'bg-muted/60'
          : 'hover:bg-muted/30'
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
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelect(item.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-semibold truncate">
              {item.institution || 'Untitled education'}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {item.studyType || 'Add degree or study type'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.date || 'Choose date range'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button type="button" size="icon-xs" variant="ghost" className="rounded-full shrink-0">
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onSelect(item.id)}>
                Edit
              </DropdownMenuItem>
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

export function EducationStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const [items, setItems] = useState<Education[]>(resume.sections.education.items)
  const [selectedId, setSelectedId] = useState(
    resume.sections.education.items[0]?.id ?? '',
  )
  const [sortByDate, setSortByDate] = useState(false)
  const [form, setForm] = useState<EducationFormState>(() =>
    buildFormState(resume.sections.education.items[0] ?? createEmptyEducation()),
  )

  useEffect(() => {
    const nextItems = resume.sections.education.items
    const fallback = nextItems[0]?.id ?? ''

    setItems(nextItems)
    setSelectedId((current) =>
      nextItems.some((item) => item.id === current) ? current : fallback,
    )
  }, [resume])

  useEffect(() => {
    const selectedItem = items.find((item) => item.id === selectedId)

    if (selectedItem) {
      setForm(buildFormState(selectedItem))
    } else {
      setForm(buildFormState(createEmptyEducation()))
    }
  }, [items, selectedId])

  const orderedItems = useMemo(() => {
    if (!sortByDate) {
      return items
    }

    return [...items].sort((left, right) => {
      const leftStart = parseDateRange(left.date).start
      const rightStart = parseDateRange(right.date).start
      return rightStart.localeCompare(leftStart)
    })
  }, [items, sortByDate])

  const selectedItem = items.find((item) => item.id === selectedId) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = orderedItems.findIndex((i) => i.id === active.id)
      const newIndex = orderedItems.findIndex((i) => i.id === over.id)
      if (oldIndex >= 0 && newIndex >= 0) {
        const reordered = arrayMove(orderedItems, oldIndex, newIndex)
        setItems(reordered)
      }
    }
  }

  function addEducation() {
    const nextItem = createEmptyEducation()
    setItems((current) => [...current, nextItem])
    setSelectedId(nextItem.id)
  }

  function removeEducation(id: string) {
    const nextItems = items.filter((item) => item.id !== id)
    setItems(nextItems)
    setSelectedId(nextItems[0]?.id ?? '')
  }

  async function saveItems(nextItems: Education[], nextSelectedId: string) {
    const nextResume = cloneResumeDocument(resume)
    nextResume.sections.education.items = nextItems

    await saveResume({
      resume: nextResume,
      title,
    })

    setItems(nextItems)
    setSelectedId(nextSelectedId)
  }

  async function handleSave() {
    if (!selectedItem) {
      return
    }

    const nextItems = items.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            institution: form.institution.trim(),
            studyType: form.studyType.trim(),
            area: form.area.trim(),
            score: form.score.trim(),
            date: formatDateRange({
              start: form.startDate,
              end: form.endDate,
              isCurrent: form.isCurrent,
            }),
            summary: paragraphTextToHtml(form.summary),
            url: {
              ...item.url,
              href: sanitizeOptionalUrl(form.url),
            },
          }
        : item,
    )

    await saveItems(nextItems, selectedItem.id)
  }

  async function handleDelete() {
    if (!selectedItem) {
      return
    }

    const nextItems = items.filter((item) => item.id !== selectedItem.id)
    await saveItems(nextItems, nextItems[0]?.id ?? '')
  }

  return (
    <StepPanel className="gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Education</h2>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <aside className="flex flex-col border-r border-border pr-6 lg:pr-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Your Education</h3>
            <Button
              type="button"
              size="icon"
              className="size-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={addEducation}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 px-1 py-2">
            <span className="text-sm text-muted-foreground">Sort by date</span>
            <button
              type="button"
              role="switch"
              aria-checked={sortByDate}
              onClick={() => setSortByDate((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center overflow-hidden rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                sortByDate ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute left-0.5 top-1/2 block size-4 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${
                  sortByDate ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 space-y-1.5 overflow-y-auto">
            {orderedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Add an education entry to start building this section.
              </div>
            ) : sortByDate ? (
              orderedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full items-start justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    item.id === selectedId
                      ? 'bg-muted/60'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold truncate">
                      {item.institution || 'Untitled education'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.studyType || 'Add degree or study type'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.date || 'Choose date range'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button type="button" size="icon-xs" variant="ghost" className="rounded-full shrink-0">
                        <EllipsisVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setSelectedId(item.id)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => removeEducation(item.id)}>
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              ))
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {orderedItems.map((item) => (
                      <EducationSortableItem
                        key={item.id}
                        item={item}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onRemove={removeEducation}
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
            onClick={handleSave}
            disabled={isSaving}
          >
            Save Education
          </Button>
        </aside>

        <main className="min-h-0">
          {selectedItem ? (
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">
                    {form.institution || 'New education'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.studyType}</p>
                </div>

                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="education-institution">Institution</Label>
                  <Input
                    id="education-institution"
                    value={form.institution}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, institution: event.target.value }))
                    }
                    placeholder="Ecole Secondaire..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education-study-type">Degree / study type</Label>
                  <Input
                    id="education-study-type"
                    value={form.studyType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, studyType: event.target.value }))
                    }
                    placeholder="Bachelor of Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education-area">Field / area</Label>
                  <Input
                    id="education-area"
                    value={form.area}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, area: event.target.value }))
                    }
                    placeholder="Software Engineering"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education-score">Score / grade</Label>
                  <Input
                    id="education-score"
                    value={form.score}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, score: event.target.value }))
                    }
                    placeholder="3.9 GPA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education-start-date">Start date</Label>
                  <MonthPicker
                    id="education-start-date"
                    value={form.startDate}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, startDate: value }))
                    }
                    placeholder="Pick start month"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education-end-date">End date</Label>
                  <MonthPicker
                    id="education-end-date"
                    value={form.endDate}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, endDate: value }))
                    }
                    placeholder="Pick end month"
                    disabled={form.isCurrent}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="education-url">School website or relevant URL</Label>
                  <Input
                    id="education-url"
                    value={form.url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, url: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <span className="text-sm font-medium">I currently study here</span>
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
                <Label htmlFor="education-summary">Details or achievements</Label>
                <Textarea
                  id="education-summary"
                  value={form.summary}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, summary: event.target.value }))
                  }
                  className="min-h-44"
                  placeholder="Relevant coursework, distinction, thesis, or leadership details"
                />
              </div>

            </div>
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Select an education entry or add a new one to start editing.
            </div>
          )}
        </main>
      </div>
    </StepPanel>
  )
}
