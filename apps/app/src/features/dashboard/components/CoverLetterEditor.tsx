import { useMemo, useState } from "react"
import type { CoverLetterDocument } from "@repo/core/schemas"
import { Save } from "lucide-react"

import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

type CoverLetterEditorProps = {
  title: string
  initialValue: CoverLetterDocument
  saving?: boolean
  onSave?: (payload: { title: string; data: CoverLetterDocument }) => Promise<void> | void
}

function paragraphsToDraft(value: string[]) {
  return value.join("\n\n")
}

function draftToParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function CoverLetterEditor({
  title,
  initialValue,
  saving = false,
  onSave,
}: Readonly<CoverLetterEditorProps>) {
  const [documentTitle, setDocumentTitle] = useState(title)
  const [draft, setDraft] = useState<CoverLetterDocument>(initialValue)
  const [bodyDraft, setBodyDraft] = useState(() => paragraphsToDraft(initialValue.content.body))

  const previewParagraphs = useMemo(
    () => [
      draft.content.greeting,
      draft.content.opening,
      ...draftToParagraphs(bodyDraft),
      draft.content.closing,
      draft.content.signature,
    ].filter(Boolean),
    [bodyDraft, draft.content.closing, draft.content.greeting, draft.content.opening, draft.content.signature],
  )

  async function handleSave() {
    const next = {
      ...draft,
      content: {
        ...draft.content,
        body: draftToParagraphs(bodyDraft),
      },
    }

    setDraft(next)
    await onSave?.({ title: documentTitle, data: next })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card className="rounded-[1.75rem] bg-background">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Cover letter details</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Mirror the structure from the original app with an editable draft and live preview.
            </p>
          </div>
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="cover-letter-title">Title</Label>
            <Input
              id="cover-letter-title"
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sender-name">Sender name</Label>
              <Input
                id="sender-name"
                value={draft.sender.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sender: { ...current.sender, name: event.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sender-title">Sender title</Label>
              <Input
                id="sender-title"
                value={draft.sender.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sender: { ...current.sender, title: event.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company</Label>
              <Input
                id="company-name"
                value={draft.context.companyName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    context: { ...current.context, companyName: event.target.value },
                    recipient: { ...current.recipient, companyName: event.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                value={draft.context.jobTitle}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    context: { ...current.context, jobTitle: event.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="greeting">Greeting</Label>
            <Input
              id="greeting"
              value={draft.content.greeting}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: { ...current.content, greeting: event.target.value },
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="opening">Opening</Label>
            <Textarea
              id="opening"
              rows={4}
              value={draft.content.opening}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: { ...current.content, opening: event.target.value },
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Body paragraphs</Label>
            <Textarea
              id="body"
              rows={10}
              value={bodyDraft}
              onChange={(event) => setBodyDraft(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="closing">Closing</Label>
            <Textarea
              id="closing"
              rows={3}
              value={draft.content.closing}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: { ...current.content, closing: event.target.value },
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signature">Signature</Label>
            <Textarea
              id="signature"
              rows={3}
              value={draft.content.signature}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: { ...current.content, signature: event.target.value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] bg-background">
        <CardHeader>
          <CardTitle className="text-2xl">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <article className="mx-auto max-w-2xl rounded-[1.5rem] border bg-white p-8 shadow-sm">
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{draft.sender.name}</p>
              <p>{draft.sender.title}</p>
              <p>{draft.sender.email}</p>
              <p>{draft.sender.phone}</p>
              <p>{draft.sender.location}</p>
            </div>
            <div className="mt-8 space-y-5 text-[15px] leading-7 text-slate-800">
              {previewParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </CardContent>
      </Card>
    </div>
  )
}
