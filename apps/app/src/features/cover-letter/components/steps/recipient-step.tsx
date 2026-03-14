import { useEffect, useState } from 'react'
import type {
  CoverLetterContext,
  CoverLetterRecipient,
} from '@repo/core/schemas'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

import { cloneCoverLetterDocument } from '../../lib/queries'
import { useCoverLetterEditor } from '../cover-letter-editor-context'
import { StepPanel } from '../cover-letter-editor-shell'

type RecipientFormState = {
  recipientName: string
  recipientTitle: string
  companyName: string
  recipientLocation: string
  recipientEmail: string
  jobTitle: string
  jobUrl: string
  tone: CoverLetterContext['tone']
}

function buildInitialState(
  recipient: CoverLetterRecipient,
  context: CoverLetterContext,
): RecipientFormState {
  return {
    recipientName: recipient.name,
    recipientTitle: recipient.title,
    companyName: recipient.companyName || context.companyName,
    recipientLocation: recipient.location,
    recipientEmail: recipient.email,
    jobTitle: context.jobTitle,
    jobUrl: context.jobUrl,
    tone: context.tone,
  }
}

const toneOptions: ReadonlyArray<CoverLetterContext['tone']> = [
  'professional',
  'confident',
  'friendly',
]

export function RecipientStep() {
  const { coverLetter, saveCoverLetter, isSaving, title } = useCoverLetterEditor()
  const [form, setForm] = useState<RecipientFormState>(() =>
    buildInitialState(coverLetter.recipient, coverLetter.context),
  )

  useEffect(() => {
    setForm(buildInitialState(coverLetter.recipient, coverLetter.context))
  }, [coverLetter])

  function updateField<Key extends keyof RecipientFormState>(
    key: Key,
    value: RecipientFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit() {
    const nextCoverLetter = cloneCoverLetterDocument(coverLetter)
    const companyName = form.companyName.trim()

    nextCoverLetter.recipient = {
      ...nextCoverLetter.recipient,
      name: form.recipientName.trim(),
      title: form.recipientTitle.trim(),
      companyName,
      location: form.recipientLocation.trim(),
      email: form.recipientEmail.trim(),
    }
    nextCoverLetter.context = {
      ...nextCoverLetter.context,
      companyName,
      jobTitle: form.jobTitle.trim(),
      jobUrl: form.jobUrl.trim(),
      tone: form.tone,
    }

    await saveCoverLetter({
      coverLetter: nextCoverLetter,
      title,
    })
  }

  return (
    <StepPanel className="gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Recipient & Role</h2>
        <p className="text-sm text-muted-foreground">
          Capture who the letter is for and the role you are targeting.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recipient-name">Recipient name</Label>
          <Input
            id="recipient-name"
            value={form.recipientName}
            onChange={(event) => updateField('recipientName', event.target.value)}
            placeholder="Hiring Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-title">Recipient title</Label>
          <Input
            id="recipient-title"
            value={form.recipientTitle}
            onChange={(event) => updateField('recipientTitle', event.target.value)}
            placeholder="Engineering Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-company">Company name</Label>
          <Input
            id="recipient-company"
            value={form.companyName}
            onChange={(event) => updateField('companyName', event.target.value)}
            placeholder="Creative Solutions Inc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-title">Job title</Label>
          <Input
            id="job-title"
            value={form.jobTitle}
            onChange={(event) => updateField('jobTitle', event.target.value)}
            placeholder="Senior Frontend Engineer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-location">Recipient location</Label>
          <Input
            id="recipient-location"
            value={form.recipientLocation}
            onChange={(event) =>
              updateField('recipientLocation', event.target.value)
            }
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-email">Recipient email</Label>
          <Input
            id="recipient-email"
            type="email"
            value={form.recipientEmail}
            onChange={(event) => updateField('recipientEmail', event.target.value)}
            placeholder="manager@company.com"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="job-url">Job listing URL</Label>
          <Input
            id="job-url"
            value={form.jobUrl}
            onChange={(event) => updateField('jobUrl', event.target.value)}
            placeholder="https://company.com/careers/role"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Tone</Label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((tone) => (
              <Button
                key={tone}
                type="button"
                variant={form.tone === tone ? 'default' : 'outline'}
                onClick={() => updateField('tone', tone)}
              >
                {tone[0].toUpperCase()}
                {tone.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-end">
        <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save recipient details'}
        </Button>
      </div>
    </StepPanel>
  )
}
