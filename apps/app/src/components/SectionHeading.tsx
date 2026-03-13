type SectionHeadingProps = {
  eyebrow?: string
  title: string
  actionLabel?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  actionLabel,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
      </div>
      {actionLabel ? <span className="section-action">{actionLabel}</span> : null}
    </div>
  )
}
