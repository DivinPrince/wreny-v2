import { Streamdown } from 'streamdown'
import 'streamdown/styles.css'

type AgentMarkdownProps = {
  children: string
  isStreaming?: boolean
}

export function AgentMarkdown({
  children,
  isStreaming = false,
}: AgentMarkdownProps) {
  return (
    <Streamdown className="agent-markdown" isAnimating={isStreaming}>
      {children}
    </Streamdown>
  )
}
