import type {
  JobCreateInput,
  JobInfo as Job,
  JobUpdateInput,
} from "@repo/core/jobs";

import { APIResource } from "../core";
import type { RequestOptions, Response } from "../types";

export type JobListParams = Partial<{
  status: Job["status"];
  search: string;
}>;

export class JobsResource extends APIResource {
  list(
    params?: JobListParams,
    options?: RequestOptions,
  ): Promise<Response<Job[]>> {
    return this._client.get("/api/jobs", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  get(id: string, options?: RequestOptions): Promise<Response<Job>> {
    return this._client.get(`/api/jobs/${id}`, options);
  }

  create(
    data: Omit<JobCreateInput, "userId">,
    options?: RequestOptions,
  ): Promise<Response<Job>> {
    return this._client.post("/api/jobs", {
      ...options,
      body: data,
    });
  }

  update(
    id: string,
    data: Omit<JobUpdateInput, "id">,
    options?: RequestOptions,
  ): Promise<Response<Job>> {
    return this._client.put(`/api/jobs/${id}`, {
      ...options,
      body: data,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/jobs/${id}`, options);
  }
}
