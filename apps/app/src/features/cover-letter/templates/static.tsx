import type { TemplateProps } from './types'
import {
  DiffText,
  usePendingChanges,
  usePendingValue,
} from '../rendering/pending-changes'

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`
}

export function Static({ coverLetter }: Readonly<TemplateProps>) {
  const pendingChanges = usePendingChanges()
  const senderName = usePendingValue({
    section: 'sender',
    field: 'name',
    fallback: coverLetter.sender.name,
  })
  const opening = usePendingValue({
    section: 'content',
    field: 'opening',
    fallback: coverLetter.content.opening,
  })
  const closing = usePendingValue({
    section: 'content',
    field: 'closing',
    fallback: coverLetter.content.closing,
  })
  const hasOpening = opening.trim().length > 0
  const hasClosing = closing.trim().length > 0
  const bodySlots = Math.max(0, 3 - (hasOpening ? 1 : 0) - (hasClosing ? 1 : 0))
  const maxPendingBodyIndex = pendingChanges.reduce((max, change) => {
    if (change.section !== 'content' || change.field !== 'body') {
      return max
    }

    const index = Number(change.itemId)
    return Number.isInteger(index) ? Math.max(max, index) : max
  }, -1)
  const previewBodyIndices = Array.from({
    length: Math.max(coverLetter.content.body.length, maxPendingBodyIndex + 1),
  })
    .map((_, index) => index)
    .filter((index) => {
      const paragraph = coverLetter.content.body[index] ?? ''
      return (
        paragraph.trim().length > 0 ||
        pendingChanges.some(
          (change) =>
            change.section === 'content' &&
            change.field === 'body' &&
            change.itemId === String(index),
        )
      )
    })
    .slice(0, bodySlots)

  return (
    <article className="cover-letter-page cover-letter-template-static">
      <header className="cover-letter-static-header">
        <div className="cover-letter-static-header-copy">
          <span className="cover-letter-static-kicker">
            <DiffText section="context" field="companyName">
              {coverLetter.context.companyName || 'Application'}
            </DiffText>
          </span>
          <h2>
            <DiffText section="context" field="jobTitle">
              {coverLetter.context.jobTitle || 'Role'}
            </DiffText>
          </h2>
          <p>
            <DiffText section="sender" field="name">
              {coverLetter.sender.name || 'Your Name'}
            </DiffText>
          </p>
        </div>
        <div className="cover-letter-static-badge">
          {(senderName || 'CL').slice(0, 2).toUpperCase()}
        </div>
      </header>

      <div className="cover-letter-static-meta">
        <div className="cover-letter-static-meta-item">
          <span className="cover-letter-static-meta-label">Recipient</span>
          <strong>
            <DiffText section="recipient" field="name">
              {coverLetter.recipient.name || 'Hiring Manager'}
            </DiffText>
          </strong>
          <span>
            <DiffText section="recipient" field="title">
              {coverLetter.recipient.title || 'Title'}
            </DiffText>
          </span>
        </div>
        <div className="cover-letter-static-meta-item">
          <span className="cover-letter-static-meta-label">Company</span>
          <strong>
            <DiffText section="recipient" field="companyName">
              {coverLetter.recipient.companyName ||
                coverLetter.context.companyName ||
                'Company Name'}
            </DiffText>
          </strong>
          <span>
            <DiffText section="context" field="jobTitle">
              {coverLetter.context.jobTitle || 'Role'}
            </DiffText>
          </span>
        </div>
      </div>

      <section className="cover-letter-static-body">
        {hasOpening || previewBodyIndices.length > 0 || hasClosing ? (
          <>
            {hasOpening ? (
              <div className="cover-letter-static-paragraph">
                <DiffText section="content" field="opening">
                  {truncate(coverLetter.content.opening, 280)}
                </DiffText>
              </div>
            ) : null}
            {previewBodyIndices.map((index) => (
              <div
                key={`body-${index}`}
                className="cover-letter-static-paragraph"
              >
                <DiffText
                  section="content"
                  field="body"
                  itemId={String(index)}
                >
                  {truncate(coverLetter.content.body[index] ?? '', 220)}
                </DiffText>
              </div>
            ))}
            {hasClosing ? (
              <div className="cover-letter-static-paragraph">
                <DiffText section="content" field="closing">
                  {truncate(coverLetter.content.closing, 220)}
                </DiffText>
              </div>
            ) : null}
          </>
        ) : (
          <div className="cover-letter-static-paragraph">
            Highlight why you are a strong fit for the role and what value you can
            bring to the team. Use a second paragraph to show impact, relevant
            experience, and alignment with the company.
          </div>
        )}
      </section>

      <footer className="cover-letter-static-footer">
        <div>
          <strong>
            <DiffText section="sender" field="name">
              {coverLetter.sender.name || 'Your Name'}
            </DiffText>
          </strong>
          <span>
            <DiffText section="sender" field="title">
              {coverLetter.sender.title || 'Professional Title'}
            </DiffText>
          </span>
        </div>
        <div className="cover-letter-static-footer-meta">
          <DiffText section="sender" field="email">
            {coverLetter.sender.email || 'email@example.com'}
          </DiffText>
          <DiffText section="sender" field="phone">
            {coverLetter.sender.phone || '(555) 123-4567'}
          </DiffText>
        </div>
      </footer>
    </article>
  )
}
