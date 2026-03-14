import { useEffect, useState } from 'react'
import type { Basics, CustomField } from '@repo/core/schemas'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'

import { cloneResumeDocument } from '../../lib/queries'
import { generateEditorId, sanitizeOptionalUrl } from '../editor-utils'
import { ProfilePhotoUpload } from '../profile-photo-upload'
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

export function ContactStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const [form, setForm] = useState<ContactFormState>(() =>
    buildInitialState(resume.basics),
  )

  useEffect(() => {
    setForm(buildInitialState(resume.basics))
  }, [resume])

  function updateField<Key extends keyof ContactFormState>(
    key: Key,
    value: ContactFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateCustomField(
    fieldId: string,
    key: keyof CustomField,
    value: string,
  ) {
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
          icon: 'link',
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
        icon: field.icon.trim() || 'link',
        name: field.name.trim(),
        value: field.value.trim(),
      })),
    }

    await saveResume({
      resume: nextResume,
      title,
    })
  }

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

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="ghost" onClick={addCustomField}>
              <Plus className="size-4" />
              Add a custom field
            </Button>
          </div>

          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">Custom fields</p>
            {form.customFields.map((field) => (
              <div
                key={field.id}
                className="grid gap-3 py-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor={`field-icon-${field.id}`}>Icon</Label>
                  <Input
                    id={`field-icon-${field.id}`}
                    value={field.icon}
                    onChange={(event) =>
                      updateCustomField(field.id, 'icon', event.target.value)
                    }
                    placeholder="github"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`field-name-${field.id}`}>Label</Label>
                  <Input
                    id={`field-name-${field.id}`}
                    value={field.name}
                    onChange={(event) =>
                      updateCustomField(field.id, 'name', event.target.value)
                    }
                    placeholder="GitHub"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`field-value-${field.id}`}>Value</Label>
                  <Input
                    id={`field-value-${field.id}`}
                    value={field.value}
                    onChange={(event) =>
                      updateCustomField(field.id, 'value', event.target.value)
                    }
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
              onClick={handleSubmit}
              disabled={isSaving}
            >
              Save Basic Info
            </Button>
          </div>
        </div>
    </StepPanel>
  )
}
