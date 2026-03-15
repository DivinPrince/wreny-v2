import type { TemplateProps } from './types'

import { InlineEditable } from '../components/inline-editable'
import { DiffText, usePendingValue } from '../rendering/pending-changes'
import { LetterScaffold } from './shared'

export function Executive({
  coverLetter,
  mode,
  editor,
}: Readonly<TemplateProps>) {
  const isEditor = mode === 'editor' && Boolean(editor)
  const senderName = usePendingValue({
    section: 'sender',
    field: 'name',
    fallback: coverLetter.sender.name,
  })

  return (
    <LetterScaffold
      coverLetter={coverLetter}
      mode={mode}
      editor={editor}
      className="cover-letter-template-executive"
      header={
        <header className="cover-letter-executive-header">
          <div>
            <p className="cover-letter-eyebrow">Re:</p>
            <h2>
              {isEditor && editor ? (
                <InlineEditable
                  element="span"
                  value={coverLetter.sender.name}
                  placeholder="Your Name"
                  ariaLabel="Sender name"
                  active={editor.activeField === 'sender.name.header'}
                  onActivate={() => editor.onActivateField('sender.name.header')}
                  onChange={(value) => editor.onChangeField('sender.name', value)}
                  onDeactivate={editor.onDeactivateField}
                />
              ) : (
                <DiffText section="sender" field="name">
                  {coverLetter.sender.name || 'Your Name'}
                </DiffText>
              )}
            </h2>
            <p>
              {isEditor && editor ? (
                <InlineEditable
                  element="span"
                  value={coverLetter.sender.title}
                  placeholder="Professional Title"
                  ariaLabel="Sender title"
                  active={editor.activeField === 'sender.title.header'}
                  onActivate={() => editor.onActivateField('sender.title.header')}
                  onChange={(value) => editor.onChangeField('sender.title', value)}
                  onDeactivate={editor.onDeactivateField}
                />
              ) : (
                <DiffText section="sender" field="title">
                  {coverLetter.sender.title || 'Professional Title'}
                </DiffText>
              )}
            </p>
          </div>
          <div className="cover-letter-executive-mark">
            <span>{(senderName || 'YN').slice(0, 2).toUpperCase()}</span>
          </div>
        </header>
      }
      meta={
        <div className="cover-letter-meta-grid">
          <div>
            <span className="cover-letter-meta-label">Company</span>
            {isEditor && editor ? (
              <InlineEditable
                element="div"
                value={coverLetter.context.companyName}
                placeholder="Company"
                ariaLabel="Company name"
                active={editor.activeField === 'context.companyName'}
                onActivate={() => editor.onActivateField('context.companyName')}
                onChange={(value) =>
                  editor.onChangeField('context.companyName', value)
                }
                onDeactivate={editor.onDeactivateField}
                displayClassName="font-semibold"
              />
            ) : (
              <strong>
                <DiffText section="context" field="companyName">
                  {coverLetter.context.companyName || 'Company'}
                </DiffText>
              </strong>
            )}
          </div>
          <div>
            <span className="cover-letter-meta-label">Role</span>
            {isEditor && editor ? (
              <InlineEditable
                element="div"
                value={coverLetter.context.jobTitle}
                placeholder="Role"
                ariaLabel="Job title"
                active={editor.activeField === 'context.jobTitle'}
                onActivate={() => editor.onActivateField('context.jobTitle')}
                onChange={(value) =>
                  editor.onChangeField('context.jobTitle', value)
                }
                onDeactivate={editor.onDeactivateField}
                displayClassName="font-semibold"
              />
            ) : (
              <strong>
                <DiffText section="context" field="jobTitle">
                  {coverLetter.context.jobTitle || 'Role'}
                </DiffText>
              </strong>
            )}
          </div>
        </div>
      }
      signatureClassName="cover-letter-signature-executive"
    />
  )
}
