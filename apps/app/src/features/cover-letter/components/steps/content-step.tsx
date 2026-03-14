import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'

import { cloneCoverLetterDocument } from '../../lib/queries'
import { useCoverLetterEditor } from '../cover-letter-editor-context'
import { StepPanel } from '../cover-letter-editor-shell'

type ContentFormState = {
  greeting: string
  opening: string
  body: string[]
  closing: string
  signature: string
}

function buildInitialState(state: ContentFormState): ContentFormState {
  return {
    greeting: state.greeting,
    opening: state.opening,
    body: state.body.length > 0 ? state.body : [''],
    closing: state.closing,
    signature: state.signature,
  }
}

export function ContentStep() {
  const { coverLetter, saveCoverLetter, isSaving, title } = useCoverLetterEditor()
  const [form, setForm] = useState<ContentFormState>(() =>
    buildInitialState(coverLetter.content),
  )

  useEffect(() => {
    setForm(buildInitialState(coverLetter.content))
  }, [coverLetter])

  function updateField<Key extends keyof ContentFormState>(
    key: Key,
    value: ContentFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateParagraph(index: number, value: string) {
    setForm((current) => ({
      ...current,
      body: current.body.map((paragraph, paragraphIndex) =>
        paragraphIndex === index ? value : paragraph,
      ),
    }))
  }

  function addParagraph() {
    setForm((current) => ({
      ...current,
      body: [...current.body, ''],
    }))
  }

  function removeParagraph(index: number) {
    setForm((current) => ({
      ...current,
      body:
        current.body.length === 1
          ? ['']
          : current.body.filter((_, paragraphIndex) => paragraphIndex !== index),
    }))
  }

  async function handleSubmit() {
    const nextCoverLetter = cloneCoverLetterDocument(coverLetter)
    nextCoverLetter.content = {
      greeting: form.greeting.trim(),
      opening: form.opening.trim(),
      body: form.body.map((paragraph) => paragraph.trim()).filter(Boolean),
      closing: form.closing.trim(),
      signature: form.signature.trim(),
    }

    await saveCoverLetter({
      coverLetter: nextCoverLetter,
      title,
    })
  }

  return (
    <StepPanel className="gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Content</h2>
        <p className="text-sm text-muted-foreground">
          Shape the narrative with a strong opening, a few focused body paragraphs,
          and a clean closing.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="letter-greeting">Greeting</Label>
          <Input
            id="letter-greeting"
            value={form.greeting}
            onChange={(event) => updateField('greeting', event.target.value)}
            placeholder="Dear Hiring Manager,"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="letter-opening">Opening paragraph</Label>
          <Textarea
            id="letter-opening"
            value={form.opening}
            onChange={(event) => updateField('opening', event.target.value)}
            placeholder="Open with why you are excited about the role and why you are a fit."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Body paragraphs</Label>
              <p className="text-sm text-muted-foreground">
                Keep each paragraph focused on one proof point or motivation.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addParagraph}>
              <Plus className="size-4" />
              Add paragraph
            </Button>
          </div>

          <div className="space-y-3">
            {form.body.map((paragraph, index) => (
              <div key={`paragraph-${index}`} className="space-y-2 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`paragraph-${index}`}>Paragraph {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeParagraph(index)}
                    aria-label={`Remove paragraph ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  id={`paragraph-${index}`}
                  value={paragraph}
                  onChange={(event) => updateParagraph(index, event.target.value)}
                  placeholder="Describe impact, relevant experience, or why this company stands out."
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="letter-closing">Closing paragraph</Label>
          <Textarea
            id="letter-closing"
            value={form.closing}
            onChange={(event) => updateField('closing', event.target.value)}
            placeholder="Close with gratitude and a clear invitation to continue the conversation."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="letter-signature">Signature</Label>
          <Textarea
            id="letter-signature"
            value={form.signature}
            onChange={(event) => updateField('signature', event.target.value)}
            placeholder={'Sincerely,\nJohn Doe'}
            className="min-h-24"
          />
        </div>
      </div>

      <div className="mt-auto flex justify-end">
        <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save content'}
        </Button>
      </div>
    </StepPanel>
  )
}
