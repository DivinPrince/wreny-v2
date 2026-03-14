import { useEffect, useState } from 'react'
import type { CoverLetterSender } from '@repo/core/schemas'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

import { cloneCoverLetterDocument } from '../../lib/queries'
import { useCoverLetterEditor } from '../cover-letter-editor-context'
import { StepPanel } from '../cover-letter-editor-shell'

type SenderFormState = {
  name: string
  email: string
  phone: string
  location: string
  title: string
  websiteLabel: string
  websiteHref: string
}

function buildInitialState(sender: CoverLetterSender): SenderFormState {
  return {
    name: sender.name,
    email: sender.email,
    phone: sender.phone,
    location: sender.location,
    title: sender.title,
    websiteLabel: sender.url.label,
    websiteHref: sender.url.href,
  }
}

export function SenderStep() {
  const { coverLetter, saveCoverLetter, isSaving, title } = useCoverLetterEditor()
  const [form, setForm] = useState<SenderFormState>(() =>
    buildInitialState(coverLetter.sender),
  )

  useEffect(() => {
    setForm(buildInitialState(coverLetter.sender))
  }, [coverLetter])

  function updateField<Key extends keyof SenderFormState>(
    key: Key,
    value: SenderFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit() {
    const nextCoverLetter = cloneCoverLetterDocument(coverLetter)
    nextCoverLetter.sender = {
      ...nextCoverLetter.sender,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      title: form.title.trim(),
      url: {
        label: form.websiteLabel.trim(),
        href: form.websiteHref.trim(),
      },
    }

    await saveCoverLetter({
      coverLetter: nextCoverLetter,
      title,
    })
  }

  return (
    <StepPanel className="gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Sender</h2>
        <p className="text-sm text-muted-foreground">
          Add your personal details exactly as they should appear on the letter.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="sender-name">Full name</Label>
          <Input
            id="sender-name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-email">Email address</Label>
          <Input
            id="sender-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="john@doe.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-phone">Phone number</Label>
          <Input
            id="sender-phone"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-location">Location</Label>
          <Input
            id="sender-location"
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-title">Professional title</Label>
          <Input
            id="sender-title"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Senior Product Designer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-website-url">Portfolio or website URL</Label>
          <Input
            id="sender-website-url"
            value={form.websiteHref}
            onChange={(event) => updateField('websiteHref', event.target.value)}
            placeholder="https://johndoe.me"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-website-label">Website label</Label>
          <Input
            id="sender-website-label"
            value={form.websiteLabel}
            onChange={(event) => updateField('websiteLabel', event.target.value)}
            placeholder="Portfolio"
          />
        </div>
      </div>

      <div className="mt-auto flex justify-end">
        <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save sender details'}
        </Button>
      </div>
    </StepPanel>
  )
}
