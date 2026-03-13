import { defaultResumeDocument, sampleCoverLetter, sampleResume, type ResumeDocument } from '@repo/core/schemas'
import type { ResumeInfo } from '@repo/core/resume'

import { api } from '#/lib/api'

import { type TemplateId } from './template-registry'
import { resolveTemplateId } from '../templates'

export const resumeKeys = {
  all: ['resumes'] as const,
  detail: (resumeId: string) => ['resumes', resumeId] as const,
}

export async function listResumes() {
  const response = await api.resumes.list()
  return response.data
}

export async function getResume(resumeId: string) {
  const response = await api.resumes.get(resumeId)
  return response.data
}

export async function createResume(input: Pick<ResumeInfo, 'title' | 'data'>) {
  const response = await api.resumes.create(input)
  return response.data
}

export async function updateResume(resumeId: string, data: ResumeDocument, title?: string) {
  const response = await api.resumes.update(resumeId, {
    data,
    ...(title ? { title } : {}),
  })

  return response.data
}

export function cloneResumeDocument(resume: ResumeDocument): ResumeDocument {
  return structuredClone(resume)
}

export function buildTemplatePreviewResume(template: TemplateId): ResumeDocument {
  const next = cloneResumeDocument(sampleResume)
  next.metadata.template = template
  next.metadata.theme.primary = template === 'onyx' ? '#0f172a' : next.metadata.theme.primary
  return next
}

export function buildStarterResume(template: TemplateId = 'onyx'): ResumeDocument {
  const next = cloneResumeDocument(sampleResume)
  next.metadata.template = template
  return next
}

export function buildBlankResume(template: TemplateId = 'onyx'): ResumeDocument {
  const next = cloneResumeDocument(defaultResumeDocument)
  next.metadata.template = template
  return next
}

export function normalizeResumeDocument(data: ResumeDocument): ResumeDocument {
  const next = cloneResumeDocument(data)
  next.metadata.template = resolveTemplateId(next.metadata.template)
  return next
}

export { sampleCoverLetter }
