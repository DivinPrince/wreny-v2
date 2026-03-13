import type {
  ResumeCreateInput,
  ResumeInfo as Resume,
  ResumeUpdateInput,
} from "@repo/core/resume";

import { APIResource } from "../core";
import type { RequestOptions, Response } from "../types";

export class ResumesResource extends APIResource {
  list(options?: RequestOptions): Promise<Response<Resume[]>> {
    return this._client.get("/api/resumes", options);
  }

  get(id: string, options?: RequestOptions): Promise<Response<Resume>> {
    return this._client.get(`/api/resumes/${id}`, options);
  }

  create(
    data: Omit<ResumeCreateInput, "userId">,
    options?: RequestOptions,
  ): Promise<Response<Resume>> {
    return this._client.post("/api/resumes", {
      ...options,
      body: data,
    });
  }

  update(
    id: string,
    data: Omit<ResumeUpdateInput, "id">,
    options?: RequestOptions,
  ): Promise<Response<Resume>> {
    return this._client.put(`/api/resumes/${id}`, {
      ...options,
      body: data,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/resumes/${id}`, options);
  }
}
