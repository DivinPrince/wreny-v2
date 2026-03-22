import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { defaultCoverLetterDocument, sampleCoverLetter, type CoverLetterDocument } from '@repo/core/schemas'
import type { CoverLetterInfo } from '@repo/core/cover-letter'

import { api } from '#/lib/api'

import { type TemplateId } from './template-registry'
import { resolveTemplateId } from '../templates'

/** Minimal user shape from session - only real profile data for prefilling */
type SessionUser = { name?: string | null; email?: string | null; image?: string | null; phone?: string | null }

function applyUserProfileToCoverLetter(doc: CoverLetterDocument, user: SessionUser): void {
  if (user.name && user.name.trim()) doc.sender.name = user.name.trim()
  if (user.email && user.email.trim()) doc.sender.email = user.email.trim()
  if (user.phone && user.phone.trim()) doc.sender.phone = user.phone.trim()
}

export const coverLetterKeys = {
  all: ['cover-letters'] as const,
  detail: (coverLetterId: string) => ['cover-letters', coverLetterId] as const,
}

export function coverLetterDetailQueryOptions(coverLetterId: string) {
  return {
    queryKey: coverLetterKeys.detail(coverLetterId),
    queryFn: () => getCoverLetter(coverLetterId),
  }
}

export async function listCoverLetters() {
  const response = await api.coverLetters.list()
  return response.data
}

export async function getCoverLetter(coverLetterId: string) {
  const response = await api.coverLetters.get(coverLetterId)
  return response.data
}

export async function createCoverLetter(
  input: Pick<CoverLetterInfo, 'title' | 'data'>,
) {
  const response = await api.coverLetters.create(input)
  return response.data
}

export async function importCoverLetterFromPdf(file: File) {
  const response = await api.coverLetters.importFromPdf(file, file.name)
  return response.data
}

export async function updateCoverLetter(
  coverLetterId: string,
  data: CoverLetterDocument,
  title?: string,
) {
  const response = await api.coverLetters.update(coverLetterId, {
    data,
    ...(title ? { title } : {}),
  })

  return response.data
}

export function cloneCoverLetterDocument(
  coverLetter: CoverLetterDocument,
): CoverLetterDocument {
  return structuredClone(coverLetter)
}

export function buildTemplatePreviewCoverLetter(
  template: TemplateId,
): CoverLetterDocument {
  const next = cloneCoverLetterDocument(sampleCoverLetter)
  next.metadata.template = template
  return next
}

export function buildStarterCoverLetter(
  template: TemplateId = 'classic',
): CoverLetterDocument {
  const next = cloneCoverLetterDocument(sampleCoverLetter)
  next.metadata.template = template
  return next
}

/** Builds a blank cover letter with only user profile data prefilled in sender (no sample data) */
export function buildNewCoverLetter(
  template: TemplateId = 'classic',
  user?: SessionUser | null,
): CoverLetterDocument {
  const next = cloneCoverLetterDocument(defaultCoverLetterDocument)
  next.metadata.template = template
  if (user) applyUserProfileToCoverLetter(next, user)
  return next
}

export function buildBlankCoverLetter(
  template: TemplateId = 'classic',
): CoverLetterDocument {
  const next = cloneCoverLetterDocument(defaultCoverLetterDocument)
  next.metadata.template = template
  return next
}

export function normalizeCoverLetterDocument(
  data: CoverLetterDocument,
): CoverLetterDocument {
  const next = cloneCoverLetterDocument(data)
  next.metadata.template = resolveTemplateId(next.metadata.template)
  next.content.body = next.content.body.filter((paragraph) => paragraph.trim().length > 0)
  return next
}

export function useCreateCoverLetter() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars?: { user?: SessionUser | null }) =>
      createCoverLetter({
        title: 'Untitled Cover Letter',
        data: buildNewCoverLetter('classic', vars?.user),
      }),
    onSuccess: (coverLetter) => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
      navigate({
        to: '/dashboard/cover-letters/$id/$step',
        params: { id: coverLetter.id, step: 'preview' },
      })
    },
  })
}

export function useImportCoverLetterFromPdf() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importCoverLetterFromPdf(file),
    onSuccess: (coverLetter) => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
      navigate({
        to: '/dashboard/cover-letters/$id/$step',
        params: { id: coverLetter.id, step: 'preview' },
      })
    },
  })
}
