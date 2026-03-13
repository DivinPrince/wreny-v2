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

  create(
    data: Omit<CoverLetterCreateInput, "userId">,
    options?: RequestOptions,
  ): Promise<Response<CoverLetter>> {
    return this._client.post("/api/cover-letters", {
      ...options,
      body: data,
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
