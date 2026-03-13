import { useEffect, useMemo, useState } from 'react'
import type { ResumeDocument } from '@repo/core/schemas'
import { Download, RefreshCw, Save } from 'lucide-react'

import { type TemplateId } from '../lib/template-registry'
import { cloneResumeDocument } from '../lib/queries'
import { ResumeRenderer } from '../rendering/ResumeRenderer'
import { CompactTemplatePicker } from './TemplateGallery'

function htmlToPlainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function plainTextToHtml(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)

  return paragraphs.join('')
}

type ResumeEditorProps = {
  resumeId: string
  title: string
  initialResume: ResumeDocument
  canSave: boolean
  saving?: boolean
  onSave?: (payload: { title: string; resume: ResumeDocument }) => Promise<void> | void
}

export function ResumeEditor({
  resumeId,
  title,
  initialResume,
  canSave,
  saving = false,
  onSave,
}: Readonly<ResumeEditorProps>) {
  const [resumeTitle, setResumeTitle] = useState(title)
  const [resume, setResume] = useState<ResumeDocument>(() => cloneResumeDocument(initialResume))
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initialResume, null, 2))
  const [jsonError, setJsonError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setResumeTitle(title)
    setResume(cloneResumeDocument(initialResume))
    setJsonDraft(JSON.stringify(initialResume, null, 2))
    setJsonError('')
  }, [initialResume, title])

  useEffect(() => {
    setJsonDraft(JSON.stringify(resume, null, 2))
  }, [resume])

  const summaryText = useMemo(() => htmlToPlainText(resume.sections.summary.content), [resume.sections.summary.content])

  function updateResume(mutator: (current: ResumeDocument) => ResumeDocument) {
    setResume((current) => mutator(cloneResumeDocument(current)))
  }

  function handleTemplateChange(templateId: TemplateId) {
    updateResume((current) => {
      current.metadata.template = templateId
      return current
    })
  }

  function handleJsonApply() {
    try {
      const parsed = JSON.parse(jsonDraft) as ResumeDocument
      setResume(parsed)
      setJsonError('')
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON')
    }
  }

  async function handleSave() {
    if (!onSave) return
    setSaveMessage('')
    await onSave({ title: resumeTitle, resume })
    setSaveMessage('Saved')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Resume File</p>
              <h2 className="font-[Newsreader] text-3xl font-semibold text-slate-950">{resumeId}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <Download size={15} />
                Print
              </button>
              <button
                type="button"
                onClick={() => {
                  setResumeTitle(title)
                  setResume(cloneResumeDocument(initialResume))
                  setSaveMessage('')
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <RefreshCw size={15} />
                Reset
              </button>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Title</span>
            <input
              value={resumeTitle}
              onChange={(event) => setResumeTitle(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-900"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Full name</span>
              <input
                value={resume.basics.name}
                onChange={(event) =>
                  updateResume((current) => {
                    current.basics.name = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Headline</span>
              <input
                value={resume.basics.headline}
                onChange={(event) =>
                  updateResume((current) => {
                    current.basics.headline = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                value={resume.basics.email}
                onChange={(event) =>
                  updateResume((current) => {
                    current.basics.email = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                value={resume.basics.phone}
                onChange={(event) =>
                  updateResume((current) => {
                    current.basics.phone = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Location</span>
              <input
                value={resume.basics.location}
                onChange={(event) =>
                  updateResume((current) => {
                    current.basics.location = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Portfolio URL</span>
              <input
                value={resume.basics.url.href}
                onChange={(event) =>
                  updateResume((current) => {
                    current.basics.url.href = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Professional summary</span>
            <textarea
              rows={6}
              value={summaryText}
              onChange={(event) =>
                updateResume((current) => {
                  current.sections.summary.content = plainTextToHtml(event.target.value)
                  return current
                })
              }
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Primary color</span>
              <input
                type="color"
                value={resume.metadata.theme.primary}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.theme.primary = event.target.value
                    return current
                  })
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Background</span>
              <input
                type="color"
                value={resume.metadata.theme.background}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.theme.background = event.target.value
                    return current
                  })
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Text color</span>
              <input
                type="color"
                value={resume.metadata.theme.text}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.theme.text = event.target.value
                    return current
                  })
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Font family</span>
              <input
                value={resume.metadata.typography.font.family}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.typography.font.family = event.target.value
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Font size</span>
              <input
                type="number"
                value={resume.metadata.typography.font.size}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.typography.font.size = Number(event.target.value) || 14
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Line height</span>
              <input
                type="number"
                step="0.05"
                value={resume.metadata.typography.lineHeight}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.typography.lineHeight = Number(event.target.value) || 1.5
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Page margin</span>
              <input
                type="number"
                value={resume.metadata.page.margin}
                onChange={(event) =>
                  updateResume((current) => {
                    current.metadata.page.margin = Number(event.target.value) || 18
                    return current
                  })
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canSave || saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save size={15} />
              {saving ? 'Saving...' : canSave ? 'Save to account' : 'Sign in to save'}
            </button>
            {saveMessage ? <span className="text-sm font-medium text-emerald-700">{saveMessage}</span> : null}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Template system</p>
            <h2 className="font-[Newsreader] text-3xl font-semibold text-slate-950">Select a template</h2>
          </div>
          <CompactTemplatePicker selectedTemplate={resume.metadata.template} onSelect={handleTemplateChange} />
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Advanced mode</p>
            <h2 className="font-[Newsreader] text-3xl font-semibold text-slate-950">Raw document JSON</h2>
          </div>
          <textarea
            rows={18}
            value={jsonDraft}
            onChange={(event) => {
              setJsonDraft(event.target.value)
              if (jsonError) setJsonError('')
            }}
            className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-slate-100 outline-none"
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleJsonApply}
              className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Apply JSON
            </button>
            {jsonError ? <p className="text-sm font-medium text-rose-600">{jsonError}</p> : null}
          </div>
        </section>
      </aside>

      <section className="resume-stage xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)]">
        <div className="resume-stage-grid">
          <ResumeRenderer resume={resume} />
        </div>
      </section>
    </div>
  )
}
