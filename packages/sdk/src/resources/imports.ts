import type { CoverLetterInfo } from "@repo/core/cover-letter";
import type { ResumeInfo } from "@repo/core/resume";

import { APIResource } from "../core";
import type { RequestOptions, Response } from "../types";

export type DocumentPdfImportResult =
  | ({ kind: "resume" } & ResumeInfo)
  | ({ kind: "coverLetter" } & CoverLetterInfo);

export class ImportsResource extends APIResource {
  documentFromPdf(
    file: File | Blob,
    filename: string,
    options?: RequestOptions,
  ): Promise<Response<DocumentPdfImportResult>> {
    const body = new FormData();
    body.append("file", file, filename);
    return this._client.post("/api/imports/document-pdf", {
      ...options,
      body,
      timeout: options?.timeout ?? 120_000,
    });
  }
}
