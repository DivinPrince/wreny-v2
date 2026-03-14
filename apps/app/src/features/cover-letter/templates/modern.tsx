import type { TemplateProps } from './types'

import { InlineEditable } from '../components/inline-editable'
import { LetterScaffold } from './shared'

export function Modern({ coverLetter, mode, editor }: Readonly<TemplateProps>) {
  const isEditor = mode === 'editor' && Boolean(editor)

  return (
    <LetterScaffold
      coverLetter={coverLetter}
      mode={mode}
      editor={editor}
      className="cover-letter-template-modern"
      header={
        <header className="cover-letter-modern-header">
          <div className="cover-letter-modern-band" />
          <div className="cover-letter-modern-title">
            <p className="cover-letter-eyebrow">Tailored For</p>
            <h2>
              {isEditor && editor ? (
                <InlineEditable
                  element="span"
                  value={coverLetter.context.companyName}
                  placeholder="Company Name"
                  ariaLabel="Company name"
                  active={editor.activeField === 'context.companyName'}
                  onActivate={() => editor.onActivateField('context.companyName')}
                  onChange={(value) =>
                    editor.onChangeField('context.companyName', value)
                  }
                  onDeactivate={editor.onDeactivateField}
                />
              ) : (
                coverLetter.context.companyName || 'Company Name'
              )}
            </h2>
            <p>
              {isEditor && editor ? (
                <InlineEditable
                  element="span"
                  value={coverLetter.context.jobTitle}
                  placeholder="Job Title"
                  ariaLabel="Job title"
                  active={editor.activeField === 'context.jobTitle'}
                  onActivate={() => editor.onActivateField('context.jobTitle')}
                  onChange={(value) =>
                    editor.onChangeField('context.jobTitle', value)
                  }
                  onDeactivate={editor.onDeactivateField}
                />
              ) : (
                coverLetter.context.jobTitle || 'Job Title'
              )}
            </p>
          </div>
        </header>
      }
      meta={
        <div className="cover-letter-callout">
          <span className="cover-letter-meta-label">Positioning note</span>
          {isEditor && editor ? (
            <InlineEditable
              multiline
              element="div"
              value={coverLetter.metadata.notes}
              placeholder="Add a concise note about why this role matters to you."
              ariaLabel="Positioning note"
              active={editor.activeField === 'metadata.notes'}
              onActivate={() => editor.onActivateField('metadata.notes')}
              onChange={(value) => editor.onChangeField('metadata.notes', value)}
              onDeactivate={editor.onDeactivateField}
            />
          ) : (
            <p>
              {coverLetter.metadata.notes.trim() ||
                'Add a concise note about why this role matters to you.'}
            </p>
          )}
        </div>
      }
      signatureClassName="cover-letter-signature-modern"
    />
  )
}
