export const GENERAL_DOCUMENT_TYPE = 'general' as const
export const GENERAL_DOCUMENT_ID = 'general' as const

export const agentPagePlaceholders = {
  initial: 'Describe your task or question…',
  active: 'Message Wreny…',
  approval: 'Approve or reject to continue…',
  awaitingFollowUp: 'Waiting for a follow-up…',
} as const

/** Landing only — one line, reference-style */
export const agentPageHero = {
  title: 'How can Wreny help with your resume and job search?',
} as const
