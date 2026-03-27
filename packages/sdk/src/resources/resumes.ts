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

  async downloadPdf(
    id: string,
    options?: RequestOptions,
  ): Promise<globalThis.Response> {
    return this._client.get<never>(`/api/resumes/${id}/pdf`, options).asResponse();
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

  importFromPdf(
    file: File | Blob,
    filename: string,
    options?: RequestOptions,
  ): Promise<Response<Resume>> {
    const body = new FormData();
    body.append("file", file, filename);
    return this._client.post("/api/resumes/import-pdf", {
      ...options,
      body,
      timeout: options?.timeout ?? 120_000,
    });
  }

  importFromLinkedIn(
    linkedinUrl: string,
    options?: RequestOptions,
  ): Promise<Response<Resume>> {
    return this._client.post("/api/resumes/import-linkedin", {
      ...options,
      body: { linkedinUrl },
      timeout: options?.timeout ?? 900_000,
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
