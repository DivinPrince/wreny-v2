import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useRef } from 'react'
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { ResumeDocument } from '@repo/core/schemas'

type ResumeDocumentStore = {
  resume: ResumeDocument
  setResume: (resume: ResumeDocument) => void
}

function createResumeStore(initialResume: ResumeDocument) {
  return createStore<ResumeDocumentStore>()((set) => ({
    resume: initialResume,
    setResume: (resume) => set({ resume }),
  }))
}

const ResumeStoreContext = createContext<StoreApi<ResumeDocumentStore> | null>(null)

export function ResumeStoreProvider({
  resume,
  children,
}: Readonly<{
  resume: ResumeDocument
  children: ReactNode
}>) {
  const storeRef = useRef<StoreApi<ResumeDocumentStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createResumeStore(resume)
  }

  useEffect(() => {
    storeRef.current?.getState().setResume(resume)
  }, [resume])

  return <ResumeStoreContext.Provider value={storeRef.current}>{children}</ResumeStoreContext.Provider>
}

export function useResumeStore<T>(selector: (state: ResumeDocumentStore) => T) {
  const store = useContext(ResumeStoreContext)

  if (!store) {
    throw new Error('useResumeStore must be used inside ResumeStoreProvider')
  }

  return useStore(store, selector)
}
