import { z } from "zod";
import { StorageService } from "@repo/core/storage";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

// Infer types from core
export type UploadResult = z.infer<typeof StorageService.UploadResult>;

/**
 * Options for the put upload operation.
 */
export interface PutOptions extends RequestOptions {
  /**
   * The folder path to upload the file to.
   * Defaults to 'uploads' if not specified.
   * @example 'products', 'marketing', 'avatars'
   */
  folder?: string;
}

/**
 * Upload API resource - Simple file uploads to Vercel Blob
 *
 * Provides a simple, Vercel-blob-like API for uploading files.
 */
export class UploadResource extends APIResource {
  /**
   * Upload a file to Vercel Blob.
   *
   * This method provides a simple interface for uploading files similar to Vercel Blob's `put` method.
   * Files are uploaded to Vercel Blob with automatic content-type detection.
   *
   * @param file - The file to upload. Can be a File, Blob, or Buffer.
   * @param options - Upload options including folder path
   * @returns A promise that resolves to the upload result with the public URL
   *
   * @example
   * ```typescript
   * // Upload from browser with File input
   * const file = event.target.files[0];
   * const result = await client.upload.put(file, {
   *   folder: 'products',
   * });
   * console.log(`Uploaded to: ${result.data.url}`);
   *
   * // Upload with custom folder
   * const result = await client.upload.put(imageFile, {
   *   folder: 'marketing/banners'
   * });
   *
   * // Upload from Node.js with Buffer
   * const buffer = await fs.readFile('image.jpg');
   * const file = new File([buffer], 'image.jpg', { type: 'image/jpeg' });
   * const result = await client.upload.put(file, { folder: 'avatars' });
   * ```
   */
  async put(
    file: File | Blob,
    options?: PutOptions,
  ): Promise<Response<UploadResult>> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    return this._client.post("/api/cms/upload", {
      body: formData,
      ...options,
    });
  }

  /**
   * Delete a previously uploaded file.
   *
   * @param url - The public URL of the file to delete
   * @param options - Request options
   * @returns A promise that resolves when the file is deleted
   *
   * @example
   * ```typescript
   * await client.upload.delete('https://example.public.blob.vercel-storage.com/file.jpg');
   * ```
   */
  async delete(url: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(
      `/api/cms/upload?url=${encodeURIComponent(url)}`,
      options,
    );
  }
}
