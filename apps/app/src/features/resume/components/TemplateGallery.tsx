import { Check, Crown } from 'lucide-react'

import { templates, type TemplateId } from '../lib/template-registry'
import { buildTemplatePreviewResume } from '../lib/queries'
import { ResumeRenderer } from '../rendering/ResumeRenderer'

function TemplateCard({
  templateId,
  selected,
  onSelect,
}: Readonly<{
  templateId: TemplateId
  selected?: boolean
  onSelect?: (templateId: TemplateId) => void
}>) {
  const template = templates.find((item) => item.id === templateId)

  if (!template) return null

  const previewResume = buildTemplatePreviewResume(template.id)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(template.id)}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white text-left shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-slate-900"
    >
      <div className="resume-thumbnail-frame m-4 mb-0">
        <div className="resume-thumbnail-scale" style={{ transform: 'scale(0.22)', width: '794px' }}>
          <ResumeRenderer resume={previewResume} mode="thumbnail" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.12))]" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-950">{template.name}</h3>
              {template.isRecommended ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                  <Crown size={12} />
                  Recommended
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
          </div>

          {selected ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
              <Check size={16} />
            </span>
          ) : (
            <span
              className="mt-1 h-3 w-3 rounded-full"
              style={{ backgroundColor: template.accent }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </button>
  )
}

export function TemplateGallery({
  selectedTemplate,
  onSelect,
}: Readonly<{
  selectedTemplate?: string
  onSelect?: (templateId: TemplateId) => void
}>) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          templateId={template.id}
          selected={selectedTemplate === template.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export function CompactTemplatePicker({
  selectedTemplate,
  onSelect,
}: Readonly<{
  selectedTemplate: string
  onSelect: (templateId: TemplateId) => void
}>) {
  return (
    <div className="grid gap-3">
      {templates.map((template) => {
        const selected = template.id === selectedTemplate

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={
              selected
                ? 'rounded-2xl border border-slate-950 bg-slate-950 px-4 py-3 text-left text-white'
                : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 transition hover:border-slate-900'
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{template.name}</p>
                <p className={selected ? 'text-sm text-slate-200' : 'text-sm text-slate-500'}>
                  {template.description}
                </p>
              </div>
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: selected ? '#f8fafc' : template.accent }}
                aria-hidden="true"
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
