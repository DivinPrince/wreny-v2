import type { TemplateProps } from './types'

import { cn } from '#/lib/utils'

import { InlineEditable } from '../components/inline-editable'
import { DiffText, usePendingValue } from '../rendering/pending-changes'
import { LetterScaffold } from './shared'

const toneOptions = ['professional', 'confident', 'friendly'] as const

export function Classic({ coverLetter, mode, editor }: Readonly<TemplateProps>) {
  const isEditor = mode === 'editor' && Boolean(editor)
  const jobUrl = usePendingValue({
    section: 'context',
    field: 'jobUrl',
    fallback: coverLetter.context.jobUrl,
  })

  return (
    <LetterScaffold
      coverLetter={coverLetter}
      mode={mode}
      editor={editor}
      className="cover-letter-template-classic"
      header={
        <header className="cover-letter-topbar">
          <div>
            <p className="cover-letter-eyebrow">Cover Letter</p>
            <h2>
              {isEditor && editor ? (
                <InlineEditable
                  element="span"
                  value={coverLetter.context.jobTitle}
                  placeholder="Role Title"
                  ariaLabel="Job title"
                  active={editor.activeField === 'context.jobTitle'}
                  onActivate={() => editor.onActivateField('context.jobTitle')}
                  onChange={(value) =>
                    editor.onChangeField('context.jobTitle', value)
                  }
                  onDeactivate={editor.onDeactivateField}
                />
              ) : (
                <DiffText section="context" field="jobTitle">
                  {coverLetter.context.jobTitle || 'Role Title'}
                </DiffText>
              )}
            </h2>
          </div>
          <div className="cover-letter-company-pill">
            {isEditor && editor ? (
              <InlineEditable
                element="span"
                value={coverLetter.context.companyName}
                placeholder="Company"
                ariaLabel="Company name"
                active={editor.activeField === 'context.companyName'}
                onActivate={() => editor.onActivateField('context.companyName')}
                onChange={(value) =>
                  editor.onChangeField('context.companyName', value)
                }
                onDeactivate={editor.onDeactivateField}
              />
            ) : (
              <DiffText section="context" field="companyName">
                {coverLetter.context.companyName || 'Company'}
              </DiffText>
            )}
          </div>
        </header>
      }
      meta={
        <div className="cover-letter-meta-grid">
          <div>
            <span className="cover-letter-meta-label">Tone</span>
            {isEditor && editor ? (
              <div className="flex flex-wrap gap-2">
                {toneOptions.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold capitalize transition-colors',
                      coverLetter.context.tone === tone
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
                    )}
                    onClick={() => editor.onChangeField('context.tone', tone)}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            ) : (
              <strong>{coverLetter.context.tone}</strong>
            )}
          </div>
          {isEditor && editor ? (
            <div>
              <span className="cover-letter-meta-label">Job URL</span>
              <InlineEditable
                element="div"
                value={coverLetter.context.jobUrl}
                placeholder="https://company.com/careers/role"
                ariaLabel="Job listing URL"
                active={editor.activeField === 'context.jobUrl'}
                onActivate={() => editor.onActivateField('context.jobUrl')}
                onChange={(value) => editor.onChangeField('context.jobUrl', value)}
                onDeactivate={editor.onDeactivateField}
                displayClassName="truncate"
              />
            </div>
          ) : jobUrl.trim().length > 0 ? (
            <div>
              <span className="cover-letter-meta-label">Job URL</span>
              <DiffText section="context" field="jobUrl" className="truncate">
                {coverLetter.context.jobUrl}
              </DiffText>
            </div>
          ) : null}
        </div>
      }
    />
  )
}
