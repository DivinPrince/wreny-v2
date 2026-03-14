import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import type { CoverLetterDocument } from '@repo/core/schemas'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

import { InlineEditable } from '../components/inline-editable'
import type { CoverLetterEditorBindings, TemplateMode } from './types'

export function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

export function splitSignature(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function getBodyParagraphs(coverLetter: CoverLetterDocument) {
  return coverLetter.content.body.filter((paragraph) => paragraph.trim().length > 0)
}

export function getRecipientLines(coverLetter: CoverLetterDocument) {
  return [
    coverLetter.recipient.name,
    coverLetter.recipient.title,
    coverLetter.recipient.companyName,
    coverLetter.recipient.location,
    coverLetter.recipient.email,
  ].filter((value) => value.trim().length > 0)
}

export function getSenderLinks(coverLetter: CoverLetterDocument) {
  return [
    coverLetter.sender.email,
    coverLetter.sender.phone,
    coverLetter.sender.location,
    coverLetter.sender.url.href
      ? coverLetter.sender.url.label || coverLetter.sender.url.href
      : '',
  ].filter((value) => value.trim().length > 0)
}

function isEditorMode(
  mode: TemplateMode | undefined,
  editor: CoverLetterEditorBindings | undefined,
): editor is CoverLetterEditorBindings {
  return mode === 'editor' && Boolean(editor)
}

export function LetterScaffold({
  coverLetter,
  mode,
  editor,
  className,
  header,
  meta,
  signatureClassName,
}: Readonly<{
  coverLetter: CoverLetterDocument
  mode?: TemplateMode
  editor?: CoverLetterEditorBindings
  className?: string
  header?: ReactNode
  meta?: ReactNode
  signatureClassName?: string
}>) {
  const isEditor = isEditorMode(mode, editor)
  const recipientLines = getRecipientLines(coverLetter)
  const senderLinks = getSenderLinks(coverLetter)
  const bodyParagraphs = getBodyParagraphs(coverLetter)
  const signatureLines = splitSignature(coverLetter.content.signature)
  const editableBodyParagraphs =
    coverLetter.content.body.length > 0 ? coverLetter.content.body : ['']

  return (
    <article className={cn('cover-letter-page', className)}>
      {header}

      <div className="cover-letter-date">{formatToday()}</div>

      {isEditor ? (
        <div className="cover-letter-recipient">
          <InlineEditable
            element="div"
            value={coverLetter.recipient.name}
            placeholder="Hiring Manager"
            ariaLabel="Recipient name"
            active={editor.activeField === 'recipient.name'}
            onActivate={() => editor.onActivateField('recipient.name')}
            onChange={(value) => editor.onChangeField('recipient.name', value)}
            onDeactivate={editor.onDeactivateField}
          />
          <InlineEditable
            element="div"
            value={coverLetter.recipient.title}
            placeholder="Recipient title"
            ariaLabel="Recipient title"
            active={editor.activeField === 'recipient.title'}
            onActivate={() => editor.onActivateField('recipient.title')}
            onChange={(value) => editor.onChangeField('recipient.title', value)}
            onDeactivate={editor.onDeactivateField}
          />
          <InlineEditable
            element="div"
            value={coverLetter.recipient.companyName}
            placeholder="Company name"
            ariaLabel="Company name"
            active={editor.activeField === 'recipient.companyName'}
            onActivate={() => editor.onActivateField('recipient.companyName')}
            onChange={(value) =>
              editor.onChangeField('recipient.companyName', value)
            }
            onDeactivate={editor.onDeactivateField}
          />
          <InlineEditable
            element="div"
            value={coverLetter.recipient.location}
            placeholder="Company location"
            ariaLabel="Company location"
            active={editor.activeField === 'recipient.location'}
            onActivate={() => editor.onActivateField('recipient.location')}
            onChange={(value) => editor.onChangeField('recipient.location', value)}
            onDeactivate={editor.onDeactivateField}
          />
          <InlineEditable
            element="div"
            value={coverLetter.recipient.email}
            placeholder="recipient@company.com"
            ariaLabel="Recipient email"
            active={editor.activeField === 'recipient.email'}
            onActivate={() => editor.onActivateField('recipient.email')}
            onChange={(value) => editor.onChangeField('recipient.email', value)}
            onDeactivate={editor.onDeactivateField}
          />
        </div>
      ) : recipientLines.length > 0 ? (
        <div className="cover-letter-recipient">
          {recipientLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      <div className="cover-letter-greeting">
        {isEditor ? (
          <InlineEditable
            value={coverLetter.content.greeting}
            placeholder="Dear Hiring Team,"
            ariaLabel="Greeting"
            active={editor.activeField === 'content.greeting'}
            onActivate={() => editor.onActivateField('content.greeting')}
            onChange={(value) => editor.onChangeField('content.greeting', value)}
            onDeactivate={editor.onDeactivateField}
          />
        ) : (
          coverLetter.content.greeting || 'Dear Hiring Team,'
        )}
      </div>

      <div className="cover-letter-body">
        {isEditor ? (
          <>
            <InlineEditable
              multiline
              element="div"
              value={coverLetter.content.opening}
              placeholder="Open with why this role matters and why you're a fit."
              ariaLabel="Opening paragraph"
              active={editor.activeField === 'content.opening'}
              onActivate={() => editor.onActivateField('content.opening')}
              onChange={(value) => editor.onChangeField('content.opening', value)}
              onDeactivate={editor.onDeactivateField}
            />
            {editableBodyParagraphs.map((paragraph, index) => (
              <div key={`body-${index}`} className="cover-letter-paragraph-row">
                <div className="min-w-0 flex-1">
                  <InlineEditable
                    multiline
                    element="div"
                    value={paragraph}
                    placeholder={`Body paragraph ${index + 1}`}
                    ariaLabel={`Body paragraph ${index + 1}`}
                    active={editor.activeField === `content.body.${index}`}
                    onActivate={() =>
                      editor.onActivateField(`content.body.${index}`)
                    }
                    onChange={(value) =>
                      editor.onChangeField(`content.body.${index}`, value)
                    }
                    onDeactivate={editor.onDeactivateField}
                  />
                </div>
                <button
                  type="button"
                  className="cover-letter-paragraph-action"
                  aria-label={`Remove body paragraph ${index + 1}`}
                  onClick={() => editor.onRemoveBodyParagraph(index)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={editor.onAddBodyParagraph}
            >
              <Plus className="size-4" />
              Add paragraph
            </Button>
            <InlineEditable
              multiline
              element="div"
              value={coverLetter.content.closing}
              placeholder="Close with gratitude and a clear next step."
              ariaLabel="Closing paragraph"
              active={editor.activeField === 'content.closing'}
              onActivate={() => editor.onActivateField('content.closing')}
              onChange={(value) => editor.onChangeField('content.closing', value)}
              onDeactivate={editor.onDeactivateField}
            />
          </>
        ) : (
          <>
            {coverLetter.content.opening.trim().length > 0 ? (
              <p>{coverLetter.content.opening}</p>
            ) : null}
            {bodyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {coverLetter.content.closing.trim().length > 0 ? (
              <p>{coverLetter.content.closing}</p>
            ) : null}
          </>
        )}
      </div>

      {isEditor ? (
        <div className={cn('cover-letter-signature', signatureClassName)}>
          <InlineEditable
            multiline
            element="div"
            value={coverLetter.content.signature}
            placeholder={'Sincerely,\nYour Name'}
            ariaLabel="Signature"
            active={editor.activeField === 'content.signature'}
            onActivate={() => editor.onActivateField('content.signature')}
            onChange={(value) => editor.onChangeField('content.signature', value)}
            onDeactivate={editor.onDeactivateField}
          />
        </div>
      ) : signatureLines.length > 0 ? (
        <div className={cn('cover-letter-signature', signatureClassName)}>
          {signatureLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      {meta ? <div className="cover-letter-meta">{meta}</div> : null}

      <footer className="cover-letter-footer">
        <div>
          <h1>
            {isEditor ? (
              <InlineEditable
                element="span"
                value={coverLetter.sender.name}
                placeholder="Your Name"
                ariaLabel="Sender name"
                active={editor.activeField === 'sender.name.footer'}
                onActivate={() => editor.onActivateField('sender.name.footer')}
                onChange={(value) => editor.onChangeField('sender.name', value)}
                onDeactivate={editor.onDeactivateField}
              />
            ) : (
              coverLetter.sender.name || 'Your Name'
            )}
          </h1>
          {isEditor ? (
            <InlineEditable
              element="div"
              value={coverLetter.sender.title}
              placeholder="Your Title"
              ariaLabel="Sender title"
              active={editor.activeField === 'sender.title.footer'}
              onActivate={() => editor.onActivateField('sender.title.footer')}
              onChange={(value) => editor.onChangeField('sender.title', value)}
              onDeactivate={editor.onDeactivateField}
            />
          ) : (
            <p>{coverLetter.sender.title || 'Your Title'}</p>
          )}
        </div>
        {isEditor ? (
          <div className="cover-letter-footer-lines">
            <InlineEditable
              element="div"
              value={coverLetter.sender.email}
              placeholder="your@email.com"
              ariaLabel="Sender email"
              active={editor.activeField === 'sender.email'}
              onActivate={() => editor.onActivateField('sender.email')}
              onChange={(value) => editor.onChangeField('sender.email', value)}
              onDeactivate={editor.onDeactivateField}
            />
            <InlineEditable
              element="div"
              value={coverLetter.sender.phone}
              placeholder="(555) 123-4567"
              ariaLabel="Sender phone"
              active={editor.activeField === 'sender.phone'}
              onActivate={() => editor.onActivateField('sender.phone')}
              onChange={(value) => editor.onChangeField('sender.phone', value)}
              onDeactivate={editor.onDeactivateField}
            />
            <InlineEditable
              element="div"
              value={coverLetter.sender.location}
              placeholder="Your location"
              ariaLabel="Sender location"
              active={editor.activeField === 'sender.location'}
              onActivate={() => editor.onActivateField('sender.location')}
              onChange={(value) => editor.onChangeField('sender.location', value)}
              onDeactivate={editor.onDeactivateField}
            />
            <InlineEditable
              element="div"
              value={coverLetter.sender.url.label}
              placeholder="Portfolio"
              ariaLabel="Sender website label"
              active={editor.activeField === 'sender.url.label'}
              onActivate={() => editor.onActivateField('sender.url.label')}
              onChange={(value) =>
                editor.onChangeField('sender.url.label', value)
              }
              onDeactivate={editor.onDeactivateField}
            />
          </div>
        ) : senderLinks.length > 0 ? (
          <div className="cover-letter-footer-lines">
            {senderLinks.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        ) : null}
      </footer>
    </article>
  )
}
