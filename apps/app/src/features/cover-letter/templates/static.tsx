import type { TemplateProps } from './types'

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`
}

function getPreviewParagraphs(body: string[]) {
  return body.filter((paragraph) => paragraph.trim().length > 0).slice(0, 3)
}

export function Static({ coverLetter }: Readonly<TemplateProps>) {
  const previewParagraphs = getPreviewParagraphs([
    coverLetter.content.opening,
    ...coverLetter.content.body,
    coverLetter.content.closing,
  ])

  return (
    <article className="cover-letter-page cover-letter-template-static">
      <header className="cover-letter-static-header">
        <div className="cover-letter-static-header-copy">
          <span className="cover-letter-static-kicker">
            {coverLetter.context.companyName || 'Cover Letter'}
          </span>
          <h2>{coverLetter.context.jobTitle || 'Target Role'}</h2>
          <p>{coverLetter.sender.name || 'Your Name'}</p>
        </div>
        <div className="cover-letter-static-badge">
          {(coverLetter.sender.name || 'CL').slice(0, 2).toUpperCase()}
        </div>
      </header>

      <div className="cover-letter-static-meta">
        <div className="cover-letter-static-meta-item">
          <span className="cover-letter-static-meta-label">Recipient</span>
          <strong>{coverLetter.recipient.name || 'Hiring Manager'}</strong>
          <span>{coverLetter.recipient.title || 'Recipient Title'}</span>
        </div>
        <div className="cover-letter-static-meta-item">
          <span className="cover-letter-static-meta-label">Company</span>
          <strong>
            {coverLetter.recipient.companyName ||
              coverLetter.context.companyName ||
              'Company Name'}
          </strong>
          <span>{coverLetter.context.jobTitle || 'Target Role'}</span>
        </div>
      </div>

      <section className="cover-letter-static-body">
        {previewParagraphs.length > 0 ? (
          previewParagraphs.map((paragraph, index) => (
            <div
              key={`${paragraph}-${index}`}
              className="cover-letter-static-paragraph"
            >
              {index === 0 ? truncate(paragraph, 280) : truncate(paragraph, 220)}
            </div>
          ))
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
          <strong>{coverLetter.sender.name || 'Your Name'}</strong>
          <span>{coverLetter.sender.title || 'Professional Title'}</span>
        </div>
        <div className="cover-letter-static-footer-meta">
          <span>{coverLetter.sender.email || 'email@example.com'}</span>
          <span>{coverLetter.sender.phone || '(555) 123-4567'}</span>
        </div>
      </footer>
    </article>
  )
}
