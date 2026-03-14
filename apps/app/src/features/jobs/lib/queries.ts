import type { JobCreateInput, JobInfo, JobUpdateInput } from "./types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "#/lib/api"

export const jobKeys = {
  all: ["jobs"] as const,
}

export async function listJobs() {
  const response = await api.jobs.list()
  return response.data
}

export async function createJob(input: Omit<JobCreateInput, "userId">) {
  const response = await api.jobs.create(input)
  return response.data
}

export async function updateJob(
  id: string,
  input: Omit<JobUpdateInput, "id">,
) {
  const response = await api.jobs.update(id, input)
  return response.data
}

export async function deleteJob(id: string) {
  await api.jobs.delete(id)
  return id
}

export type JobReorderUpdate = {
  id: string
  data: Pick<Omit<JobUpdateInput, "id">, "position" | "status">
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<JobCreateInput, "userId">) => createJob(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<JobUpdateInput, "id"> }) =>
      updateJob(id, data),
    onSuccess: async (job) => {
      queryClient.setQueryData<JobInfo[] | undefined>(jobKeys.all, (current) =>
        current?.map((item) => (item.id === job.id ? job : item)),
      )
      await queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: async (deletedId) => {
      queryClient.setQueryData<JobInfo[] | undefined>(jobKeys.all, (current) =>
        current?.filter((item) => item.id !== deletedId),
      )
      await queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useReorderJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: JobReorderUpdate[]) => {
      await Promise.all(updates.map((update) => updateJob(update.id, update.data)))
      return updates
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}
