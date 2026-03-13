import { StorageService } from "@repo/core/storage";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  noContent,
  ok,
  requireAdmin,
  validate,
} from "./common";

const deleteQuerySchema = z.object({
  url: z.string().url(),
});

export const uploadApi = new Hono<AppEnv>()
  .use("*", requireAdmin)
  .post("/upload", async (c) => {
    const form = await c.req.formData();
    const fileEntry = form.get("file");
    const folderEntry = form.get("folder");

    if (!(fileEntry instanceof File)) {
      return c.json(
        {
          type: "validation",
          code: "missing_file",
          message: "A file field is required",
          param: "file",
        },
        400,
      );
    }

    const upload = await StorageService.upload(
      new Uint8Array(await fileEntry.arrayBuffer()),
      {
        filename: fileEntry.name || undefined,
        folder: typeof folderEntry === "string" ? folderEntry : undefined,
        contentType: fileEntry.type || "application/octet-stream",
      },
    );

    return ok(c, upload, 201);
  })
  .delete("/upload", validate("query", deleteQuerySchema), async (c) => {
    await StorageService.remove(c.req.valid("query").url);
    return noContent(c);
  });
