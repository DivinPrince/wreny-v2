import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'

import { cloneResumeDocument } from '../../lib/queries'
import { toMarkdownForForm, toMarkdownForStorage } from '../editor-utils'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

export function SummaryStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const [summary, setSummary] = useState(() =>
    toMarkdownForForm(resume.sections.summary.content),
  )

  useEffect(() => {
    setSummary(toMarkdownForForm(resume.sections.summary.content))
  }, [resume])

  async function handleSave() {
    const nextResume = cloneResumeDocument(resume)
    nextResume.sections.summary.content = toMarkdownForStorage(summary)

    await saveResume({
      resume: nextResume,
      title,
    })
  }

  return (
    <StepPanel className="gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Summary</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Keep it concise and outcome-focused.
        </p>
      </div>

      <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <div className="flex flex-col xl:border-r xl:pr-8 xl:border-border">
          <div className="space-y-2">
            <Label htmlFor="resume-summary">Professional summary</Label>
            <Textarea
              id="resume-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="min-h-[420px]"
              placeholder="A highly accomplished and results-oriented technology professional..."
            />
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick guidance</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Lead with your role, niche, and years of experience.</li>
              <li>Mention notable strengths, industries, or business outcomes.</li>
              <li>Write in plain language that still feels confident.</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              size="lg"
              className="px-5"
              onClick={handleSave}
              disabled={isSaving}
            >
              Save Summary
            </Button>
          </div>
        </div>
      </div>
    </StepPanel>
  )
}
