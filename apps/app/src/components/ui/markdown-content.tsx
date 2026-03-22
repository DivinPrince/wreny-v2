import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import { cn } from '#/lib/utils'

type MarkdownContentProps = {
  children: string
  className?: string
  style?: React.CSSProperties
  inline?: boolean
}

function getComponents(inline: boolean): Components {
  return {
    p: ({ children }) =>
      inline ? (
        <span>{children}</span>
      ) : (
        <p className="mb-2 last:mb-0">{children}</p>
      ),
    ul: ({ children }) => (
      <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-0">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="underline hover:no-underline"
      >
        {children}
      </a>
    ),
  }
}

export function MarkdownContent({
  children,
  className,
  style,
  inline = false,
}: MarkdownContentProps) {
  const content = children?.trim() || ''
  if (!content) return null

  const Wrapper = inline ? 'span' : 'div'

  return (
    <Wrapper className={cn(className)} style={style}>
      <ReactMarkdown components={getComponents(inline)}>
        {content}
      </ReactMarkdown>
    </Wrapper>
  )
}
