import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ResumeInfo } from '@repo/core/resume'
import type { ResumeDocument } from '@repo/core/schemas'

import {
  normalizeResumeDocument,
  resumeKeys,
  updateResume,
} from '../lib/queries'

type SaveResumeArgs = {
  resume: ResumeDocument
  title?: string
}

type ResumeEditorContextValue = {
  resumeId: string
  title: string
  resume: ResumeDocument
  isSaving: boolean
  saveResume: (args: SaveResumeArgs) => Promise<void>
}

const ResumeEditorContext = createContext<ResumeEditorContextValue | null>(null)

export function ResumeEditorProvider({
  resumeInfo,
  children,
}: Readonly<{
  resumeInfo: ResumeInfo
  children: ReactNode
}>) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(resumeInfo.title)
  const [resume, setResume] = useState<ResumeDocument>(() =>
    normalizeResumeDocument(resumeInfo.data),
  )

  useEffect(() => {
    setResume(normalizeResumeDocument(resumeInfo.data))
    setTitle(resumeInfo.title)
  }, [resumeInfo])

  const saveMutation = useMutation({
    mutationFn: async ({ resume: nextResume, title: nextTitle }: SaveResumeArgs) =>
      updateResume(resumeInfo.id, nextResume, nextTitle),
    onSuccess: (updatedResume) => {
      const normalized = normalizeResumeDocument(updatedResume.data)

      setResume(normalized)
      setTitle(updatedResume.title)

      queryClient.setQueryData(resumeKeys.detail(updatedResume.id), updatedResume)
      queryClient.setQueryData<ResumeInfo[] | undefined>(
        resumeKeys.all,
        (current) =>
          current?.map((item) =>
            item.id === updatedResume.id ? updatedResume : item,
          ) ?? current,
      )
    },
  })

  const value = useMemo<ResumeEditorContextValue>(
    () => ({
      resumeId: resumeInfo.id,
      title,
      resume,
      isSaving: saveMutation.isPending,
      saveResume: async ({ resume: nextResume, title: nextTitle }) => {
        await saveMutation.mutateAsync({
          resume: nextResume,
          title: nextTitle ?? title,
        })
      },
    }),
    [resume, resumeInfo.id, saveMutation, title],
  )

  return (
    <ResumeEditorContext.Provider value={value}>
      {children}
    </ResumeEditorContext.Provider>
  )
}

export function useResumeEditor() {
  const value = useContext(ResumeEditorContext)

  if (!value) {
    throw new Error('useResumeEditor must be used within ResumeEditorProvider')
  }

  return value
}
