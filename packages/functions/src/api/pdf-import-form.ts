import { ErrorCodes, VisibleError } from "@repo/core/error";

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export type PdfUploadResult = {
  bytes: Uint8Array;
  title: string;
};

function titleFromFilename(name: string, fallback: string): string {
  const base = name.replace(/\.pdf$/i, "").trim() || fallback;
  return base.length > 255 ? base.slice(0, 255) : base;
}

export async function parsePdfUpload(
  c: { req: { formData: () => Promise<FormData> } },
  options: { titleFallback: string },
): Promise<PdfUploadResult> {
  const form = await c.req.formData();
  const fileEntry = form.get("file");

  if (!(fileEntry instanceof File)) {
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.MISSING_REQUIRED_FIELD,
      "A PDF file is required",
      "file",
    );
  }

  if (!fileEntry.name.toLowerCase().endsWith(".pdf")) {
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.INVALID_FORMAT,
      "File must be a PDF (.pdf)",
      "file",
    );
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.INVALID_FORMAT,
      "The PDF file is empty",
      "file",
    );
  }

  if (bytes.byteLength > MAX_PDF_BYTES) {
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.INVALID_FORMAT,
      "PDF must be 8 MB or smaller",
      "file",
    );
  }

  return {
    bytes,
    title: titleFromFilename(fileEntry.name, options.titleFallback),
  };
}
