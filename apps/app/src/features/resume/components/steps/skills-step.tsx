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
import type { Skill } from '@repo/core/schemas'
import { defaultSkill } from '@repo/core/schemas'
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

import { cloneResumeDocument } from '../../lib/queries'
import { generateEditorId } from '../editor-utils'
import { SectionChromeSettings } from '../section-chrome-settings'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

type SkillFormState = {
  name: string
  description: string
  level: number
  keywords: string
}

function createEmptySkill() {
  return {
    ...defaultSkill,
    id: generateEditorId(),
  }
}

function buildFormState(item: Skill): SkillFormState {
  return {
    name: item.name,
    description: item.description,
    level: item.level,
    keywords: item.keywords.join(', '),
  }
}

function SkillSortableItem({
  item,
  selectedId,
  onSelect,
  onRemove,
  renderLevel,
}: Readonly<{
  item: Skill
  selectedId: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  renderLevel: (level: number) => React.ReactNode
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
          <div className="min-w-0 space-y-2">
            <p className="font-semibold truncate">
              {item.name || 'Untitled skill'}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {item.description || 'Add a level descriptor'}
            </p>
            {renderLevel(item.level)}
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

const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
} as const

function RatingDots({ level }: Readonly<{ level: number }>) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`size-2 rounded-full transition-colors ${
            index < level ? 'bg-primary' : 'bg-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  )
}

function ProficiencySelector({
  level,
  onChange,
}: Readonly<{
  level: number
  onChange: (level: number) => void
}>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          How confident are you?
        </p>
        <span
          className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
          aria-live="polite"
        >
          {PROFICIENCY_LABELS[level] ?? PROFICIENCY_LABELS[1]}
        </span>
      </div>

      <div
        className="flex items-stretch gap-1 rounded-xl bg-muted/40 p-1.5"
        role="group"
        aria-label="Proficiency level"
      >
        {([1, 2, 3, 4, 5] as const).map((value) => {
          const isFilled = level >= value
          const isActive = level === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              title={PROFICIENCY_LABELS[value]}
              aria-label={`${PROFICIENCY_LABELS[value]} — level ${value}`}
              aria-pressed={isActive}
              className={`relative flex flex-1 items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isFilled
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SkillsStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const skillsSection = resume.sections.skills
  const [items, setItems] = useState<Skill[]>(resume.sections.skills.items)
  const [selectedId, setSelectedId] = useState(resume.sections.skills.items[0]?.id ?? '')
  const [form, setForm] = useState<SkillFormState>(() =>
    buildFormState(resume.sections.skills.items[0] ?? createEmptySkill()),
  )

  useEffect(() => {
    const nextItems = resume.sections.skills.items
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
      setForm(buildFormState(createEmptySkill()))
    }
  }, [items, selectedId])

  const selectedItem = items.find((item) => item.id === selectedId) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      if (oldIndex >= 0 && newIndex >= 0) {
        const reordered = arrayMove(items, oldIndex, newIndex)
        setItems(reordered)
      }
    }
  }

  function addSkill() {
    const nextItem = createEmptySkill()
    setItems((current) => [...current, nextItem])
    setSelectedId(nextItem.id)
  }

  function removeSkill(id: string) {
    const nextItems = items.filter((item) => item.id !== id)
    setItems(nextItems)
    setSelectedId(nextItems[0]?.id ?? '')
  }

  async function saveItems(nextItems: Skill[], nextSelectedId: string) {
    const nextResume = cloneResumeDocument(resume)
    nextResume.sections.skills.items = nextItems

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
            name: form.name.trim(),
            description: form.description.trim(),
            level: form.level,
            keywords: form.keywords
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean),
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Skills</h2>
        </div>
        <SectionChromeSettings
          values={{
            name: skillsSection.name,
            visible: skillsSection.visible,
            columns: skillsSection.columns,
            separateLinks: skillsSection.separateLinks,
          }}
          onChange={(v) => {
            void (async () => {
              const nextResume = cloneResumeDocument(resume)
              Object.assign(nextResume.sections.skills, v)
              await saveResume({ resume: nextResume, title })
            })()
          }}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <aside className="flex flex-col border-r border-border pr-6 lg:pr-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Your Skills</h3>
            <Button
              type="button"
              size="icon"
              className="size-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={addSkill}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Drag to reorder
          </p>

          <div className="mt-3 space-y-1.5 overflow-y-auto">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Add a skill to build your strengths section.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <SkillSortableItem
                        key={item.id}
                        item={item}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onRemove={removeSkill}
                        renderLevel={(level) => <RatingDots level={level} />}
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
            Save Skill
          </Button>
        </aside>

        <main className="min-h-0">
          {selectedItem ? (
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">
                    {form.name || 'New skill'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>

                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="skill-name">Skill name</Label>
                  <Input
                    id="skill-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="TypeScript"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill-description">Description</Label>
                  <Input
                    id="skill-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Advanced / Production-ready"
                  />
                </div>
              </div>

              <div className="py-4">
                <ProficiencySelector
                  level={form.level}
                  onChange={(level) =>
                    setForm((current) => ({ ...current, level }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-keywords">Keywords</Label>
                <Input
                  id="skill-keywords"
                  value={form.keywords}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, keywords: event.target.value }))
                  }
                  placeholder="React.js, Next.js, Tailwind CSS"
                />
                <p className="text-sm text-muted-foreground">
                  Separate each keyword with a comma.
                </p>
              </div>

            </div>
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Select a skill or add a new one to start editing.
            </div>
          )}
        </main>
      </div>
    </StepPanel>
  )
}
