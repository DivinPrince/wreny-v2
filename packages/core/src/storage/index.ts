import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { z } from "zod";
import { VisibleError } from "../error";
import { createID } from "../util/id";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
  });
  return s3Client;
}

async function getBucketName(): Promise<string> {
  // Use SST Resource when available (Lambda or sst dev)
  try {
    const { Resource } = await import("sst");
    const name = (Resource as { MediaBucket?: { name: string } })?.MediaBucket?.name;
    if (name) return name;
  } catch {
    // Not in SST context
  }
  // Fallback for local dev without sst (bun run dev)
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new VisibleError(
      "internal",
      "storage_not_configured",
      "S3 storage not configured. Set S3_BUCKET_NAME for local dev, or run with sst dev.",
    );
  }
  return bucket;
}

function getBucketRegion(): string {
  return process.env.AWS_REGION || "us-east-1";
}

function buildPublicUrl(bucketName: string, key: string): string {
  const region = getBucketRegion();
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function parseS3Url(url: string, bucketName: string): string | null {
  const region = getBucketRegion();
  // Virtual-hosted: https://bucket.s3.region.amazonaws.com/key
  const vhostPrefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;
  if (url.startsWith(vhostPrefix)) return url.replace(vhostPrefix, "");
  // us-east-1 can omit region: https://bucket.s3.amazonaws.com/key
  const globalPrefix = `https://${bucketName}.s3.amazonaws.com/`;
  if (url.startsWith(globalPrefix)) return url.replace(globalPrefix, "");
  return null;
}

export namespace StorageService {
  export const UploadResult = z
    .object({
      url: z.string().meta({ description: "Public URL of uploaded file" }),
      filename: z.string().meta({ description: "Generated filename" }),
      contentType: z.string().meta({ description: "File MIME type" }),
      size: z.number().meta({ description: "File size in bytes" }),
    })
    .meta({ ref: "UploadResult", description: "Upload result" });

  export type UploadResultType = z.infer<typeof UploadResult>;

  export async function upload(
    file: Buffer | Uint8Array,
    options: {
      filename?: string;
      folder?: string;
      contentType: string;
    },
  ): Promise<UploadResultType> {
    if (!ALLOWED_MIME_TYPES.includes(options.contentType)) {
      throw new VisibleError(
        "validation",
        "invalid_file_type",
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    if (file.length > MAX_FILE_SIZE) {
      throw new VisibleError(
        "validation",
        "file_too_large",
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const s3 = getS3Client();
    const bucketName = await getBucketName();

    const ext = getExtensionFromMime(options.contentType);
    const filename = options.filename || `${createID("file")}${ext}`;
    const key = options.folder ? `${options.folder}/${filename}` : filename;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: Buffer.from(file),
        ContentType: options.contentType,
        CacheControl: "public, max-age=31536000",
      }),
    );

    const url = buildPublicUrl(bucketName, key);

    return {
      url,
      filename: key,
      contentType: options.contentType,
      size: file.length,
    };
  }

  export async function remove(url: string): Promise<void> {
    const bucketName = await getBucketName();
    const key = parseS3Url(url, bucketName);
    if (!key) {
      throw new VisibleError(
        "validation",
        "invalid_url",
        "URL does not belong to this storage bucket",
      );
    }

    const s3 = getS3Client();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
  }
}

function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[mimeType] || "";
}
