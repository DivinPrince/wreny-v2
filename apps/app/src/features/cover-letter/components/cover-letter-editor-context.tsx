import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CoverLetterInfo } from '@repo/core/cover-letter'
import type { CoverLetterDocument } from '@repo/core/schemas'

import {
  coverLetterKeys,
  normalizeCoverLetterDocument,
  updateCoverLetter,
} from '../lib/queries'

type SaveCoverLetterArgs = {
  coverLetter: CoverLetterDocument
  title?: string
}

type CoverLetterEditorContextValue = {
  coverLetterId: string
  title: string
  coverLetter: CoverLetterDocument
  isSaving: boolean
  saveCoverLetter: (args: SaveCoverLetterArgs) => Promise<void>
}

const CoverLetterEditorContext =
  createContext<CoverLetterEditorContextValue | null>(null)

export function CoverLetterEditorProvider({
  coverLetterInfo,
  children,
}: Readonly<{
  coverLetterInfo: CoverLetterInfo
  children: ReactNode
}>) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(coverLetterInfo.title)
  const [coverLetter, setCoverLetter] = useState<CoverLetterDocument>(() =>
    normalizeCoverLetterDocument(coverLetterInfo.data),
  )

  const saveMutation = useMutation({
    mutationFn: async ({
      coverLetter: nextCoverLetter,
      title: nextTitle,
    }: SaveCoverLetterArgs) =>
      updateCoverLetter(coverLetterInfo.id, nextCoverLetter, nextTitle),
    onSuccess: (updatedCoverLetter) => {
      const normalized = normalizeCoverLetterDocument(updatedCoverLetter.data)

      setCoverLetter(normalized)
      setTitle(updatedCoverLetter.title)

      queryClient.setQueryData(
        coverLetterKeys.detail(updatedCoverLetter.id),
        updatedCoverLetter,
      )
      queryClient.setQueryData<CoverLetterInfo[] | undefined>(
        coverLetterKeys.all,
        (current) =>
          current?.map((item) =>
            item.id === updatedCoverLetter.id ? updatedCoverLetter : item,
          ) ?? current,
      )
    },
  })

  const value = useMemo<CoverLetterEditorContextValue>(
    () => ({
      coverLetterId: coverLetterInfo.id,
      title,
      coverLetter,
      isSaving: saveMutation.isPending,
      saveCoverLetter: async ({
        coverLetter: nextCoverLetter,
        title: nextTitle,
      }) => {
        await saveMutation.mutateAsync({
          coverLetter: nextCoverLetter,
          title: nextTitle ?? title,
        })
      },
    }),
    [coverLetter, coverLetterInfo.id, saveMutation, title],
  )

  return (
    <CoverLetterEditorContext.Provider value={value}>
      {children}
    </CoverLetterEditorContext.Provider>
  )
}

export function useCoverLetterEditor() {
  const value = useContext(CoverLetterEditorContext)

  if (!value) {
    throw new Error(
      'useCoverLetterEditor must be used within CoverLetterEditorProvider',
    )
  }

  return value
}
