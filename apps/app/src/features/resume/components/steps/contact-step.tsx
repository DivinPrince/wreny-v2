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
import { defaultCustomFieldIcon, type Basics, type CustomField, type Profile } from '@repo/core/schemas'
import { defaultProfile } from '@repo/core/schemas'
import { EllipsisVertical, GripVertical, Plus, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'

import { cloneResumeDocument } from '../../lib/queries'
import { IconifyIconPicker } from '../iconify-icon-picker'
import { generateEditorId, sanitizeOptionalUrl } from '../editor-utils'
import { ProfilePhotoUpload } from '../profile-photo-upload'
import { SectionChromeSettings } from '../section-chrome-settings'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

type ContactFormState = {
  name: string
  headline: string
  email: string
  phone: string
  location: string
  websiteLabel: string
  websiteHref: string
  pictureUrl: string
  customFields: CustomField[]
}

function buildInitialState(basics: Basics): ContactFormState {
  return {
    name: basics.name,
    headline: basics.headline,
    email: basics.email,
    phone: basics.phone,
    location: basics.location,
    websiteLabel: basics.url.label,
    websiteHref: basics.url.href,
    pictureUrl: basics.picture.url,
    customFields: basics.customFields,
  }
}

function emptyProfile(): Profile {
  return { ...defaultProfile, id: generateEditorId() }
}

function ProfileRow({
  item,
  selectedId,
  onSelect,
  onRemove,
}: Readonly<{
  item: Profile
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
      className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium truncate">{item.network || 'Network'}</p>
            <p className="text-xs text-muted-foreground truncate">@{item.username || 'username'}</p>
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

export function ContactStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const profilesSection = resume.sections.profiles
  const [form, setForm] = useState<ContactFormState>(() => buildInitialState(resume.basics))
  const [profileItems, setProfileItems] = useState<Profile[]>(profilesSection.items)
  const [profileSelectedId, setProfileSelectedId] = useState(profilesSection.items[0]?.id ?? '')
  const [profileForm, setProfileForm] = useState(() => {
    const p = profilesSection.items[0] ?? emptyProfile()
    return {
      network: p.network,
      username: p.username,
      icon: p.icon,
      urlLabel: p.url.label,
      urlHref: p.url.href,
    }
  })

  useEffect(() => {
    setForm(buildInitialState(resume.basics))
  }, [resume])

  useEffect(() => {
    const next = resume.sections.profiles.items
    const fb = next[0]?.id ?? ''
    setProfileItems(next)
    setProfileSelectedId((c) => (next.some((i) => i.id === c) ? c : fb))
  }, [resume])

  useEffect(() => {
    const p = profileItems.find((i) => i.id === profileSelectedId) ?? emptyProfile()
    setProfileForm({
      network: p.network,
      username: p.username,
      icon: p.icon,
      urlLabel: p.url.label,
      urlHref: p.url.href,
    })
  }, [profileItems, profileSelectedId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onProfileDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oi = profileItems.findIndex((i) => i.id === active.id)
      const ni = profileItems.findIndex((i) => i.id === over.id)
      if (oi >= 0 && ni >= 0) setProfileItems(arrayMove(profileItems, oi, ni))
    }
  }

  function updateField<Key extends keyof ContactFormState>(key: Key, value: ContactFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateCustomField(fieldId: string, key: keyof CustomField, value: string) {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.map((field) =>
        field.id === fieldId ? { ...field, [key]: value } : field,
      ),
    }))
  }

  function addCustomField() {
    setForm((current) => ({
      ...current,
      customFields: [
        ...current.customFields,
        {
          id: generateEditorId(),
          icon: defaultCustomFieldIcon,
          name: '',
          value: '',
        },
      ],
    }))
  }

  function removeCustomField(fieldId: string) {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.filter((field) => field.id !== fieldId),
    }))
  }

  async function handleSubmit() {
    const nextProfiles = profileItems.map((item) =>
      item.id === profileSelectedId
        ? {
            ...item,
            network: profileForm.network.trim(),
            username: profileForm.username.trim(),
            icon: profileForm.icon.trim(),
            url: {
              label: profileForm.urlLabel.trim(),
              href: sanitizeOptionalUrl(profileForm.urlHref),
            },
          }
        : item,
    )

    const nextResume = cloneResumeDocument(resume)
    nextResume.basics = {
      ...nextResume.basics,
      name: form.name.trim(),
      headline: form.headline.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      url: {
        label: form.websiteLabel.trim(),
        href: sanitizeOptionalUrl(form.websiteHref),
      },
      picture: {
        ...nextResume.basics.picture,
        url: form.pictureUrl.trim(),
      },
      customFields: form.customFields.map((field) => ({
        ...field,
        icon: field.icon.trim() || defaultCustomFieldIcon,
        name: field.name.trim(),
        value: field.value.trim(),
      })),
    }
    nextResume.sections.profiles.items = nextProfiles

    await saveResume({
      resume: nextResume,
      title,
    })
  }

  const selectedProfile = profileItems.find((i) => i.id === profileSelectedId) ?? null

  return (
    <StepPanel className="gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-sm text-muted-foreground">
          Add the essentials recruiters should see first.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium">Your photo</p>
          <ProfilePhotoUpload
            value={form.pictureUrl}
            onChange={(url) => updateField('pictureUrl', url)}
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Irasubiza Divin Prince"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-address">Email address</Label>
            <Input
              id="email-address"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="name@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone number</Label>
            <Input
              id="phone-number"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="+250 7..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(event) => updateField('location', event.target.value)}
              placeholder="Kigali, Rwanda"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Professional headline</Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(event) => updateField('headline', event.target.value)}
              placeholder="Founder, CTO, Product Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              value={form.websiteHref}
              onChange={(event) => updateField('websiteHref', event.target.value)}
              placeholder="https://your-site.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-label">Website label</Label>
            <Input
              id="website-label"
              value={form.websiteLabel}
              onChange={(event) => updateField('websiteLabel', event.target.value)}
              placeholder="Portfolio"
            />
          </div>
        </div>

        <SectionChromeSettings
          values={{
            name: profilesSection.name,
            visible: profilesSection.visible,
            columns: profilesSection.columns,
            separateLinks: profilesSection.separateLinks,
          }}
          onChange={(v) => {
            void (async () => {
              const nextResume = cloneResumeDocument(resume)
              Object.assign(nextResume.sections.profiles, v)
              await saveResume({ resume: nextResume, title })
            })()
          }}
        />

        <div className="rounded-xl border border-border bg-muted/15 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Social profiles</p>
              <p className="text-xs text-muted-foreground">Shown in the profiles section of your resume.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                const n = emptyProfile()
                setProfileItems((c) => [...c, n])
                setProfileSelectedId(n.id)
              }}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              {profileItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No profiles yet.</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onProfileDragEnd}>
                  <SortableContext items={profileItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="max-h-56 space-y-1 overflow-y-auto">
                      {profileItems.map((item) => (
                        <ProfileRow
                          key={item.id}
                          item={item}
                          selectedId={profileSelectedId}
                          onSelect={setProfileSelectedId}
                          onRemove={(id) => {
                            const next = profileItems.filter((i) => i.id !== id)
                            setProfileItems(next)
                            setProfileSelectedId(next[0]?.id ?? '')
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="space-y-3">
              {selectedProfile ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Network</Label>
                      <Input
                        value={profileForm.network}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, network: e.target.value }))
                        }
                        placeholder="LinkedIn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={profileForm.username}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, username: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Icon</Label>
                      <IconifyIconPicker
                        value={profileForm.icon}
                        onChange={(slug) => setProfileForm((f) => ({ ...f, icon: slug }))}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link label</Label>
                      <Input
                        value={profileForm.urlLabel}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, urlLabel: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={profileForm.urlHref}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, urlHref: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Add a profile to edit it.</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={addCustomField}>
            <Plus className="size-4" />
            Add a custom field
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Custom fields</p>
          {form.customFields.map((field) => (
            <div
              key={field.id}
              className="grid gap-3 py-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor={`field-icon-${field.id}`}>Icon</Label>
                <IconifyIconPicker
                  id={`field-icon-${field.id}`}
                  value={field.icon}
                  onChange={(slug) => updateCustomField(field.id, 'icon', slug)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`field-name-${field.id}`}>Label</Label>
                <Input
                  id={`field-name-${field.id}`}
                  value={field.name}
                  onChange={(event) => updateCustomField(field.id, 'name', event.target.value)}
                  placeholder="GitHub"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`field-value-${field.id}`}>Value</Label>
                <Input
                  id={`field-value-${field.id}`}
                  value={field.value}
                  onChange={(event) => updateCustomField(field.id, 'value', event.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end"
                onClick={() => removeCustomField(field.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            size="lg"
            className="px-5"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
          >
            Save contact & profiles
          </Button>
        </div>
      </div>
    </StepPanel>
  )
}
