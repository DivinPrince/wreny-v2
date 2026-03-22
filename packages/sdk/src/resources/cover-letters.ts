import type {
  CoverLetterCreateInput,
  CoverLetterInfo as CoverLetter,
  CoverLetterUpdateInput,
} from "@repo/core/cover-letter";

import { APIResource } from "../core";
import type { RequestOptions, Response } from "../types";

export class CoverLettersResource extends APIResource {
  list(options?: RequestOptions): Promise<Response<CoverLetter[]>> {
    return this._client.get("/api/cover-letters", options);
  }

  get(id: string, options?: RequestOptions): Promise<Response<CoverLetter>> {
    return this._client.get(`/api/cover-letters/${id}`, options);
  }

  async downloadPdf(
    id: string,
    options?: RequestOptions,
  ): Promise<globalThis.Response> {
    return this._client
      .get<never>(`/api/cover-letters/${id}/pdf`, options)
      .asResponse();
  }

  create(
    data: Omit<CoverLetterCreateInput, "userId">,
    options?: RequestOptions,
  ): Promise<Response<CoverLetter>> {
    return this._client.post("/api/cover-letters", {
      ...options,
      body: data,
    });
  }

  importFromPdf(
    file: File | Blob,
    filename: string,
    options?: RequestOptions,
  ): Promise<Response<CoverLetter>> {
    const body = new FormData();
    body.append("file", file, filename);
    return this._client.post("/api/cover-letters/import-pdf", {
      ...options,
      body,
      timeout: options?.timeout ?? 120_000,
    });
  }

  update(
    id: string,
    data: Omit<CoverLetterUpdateInput, "id">,
    options?: RequestOptions,
  ): Promise<Response<CoverLetter>> {
    return this._client.put(`/api/cover-letters/${id}`, {
      ...options,
      body: data,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/cover-letters/${id}`, options);
  }
}
