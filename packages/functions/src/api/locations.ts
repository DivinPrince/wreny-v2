import { LocationService } from "@repo/core/location";
import { StockService } from "@repo/core/stock";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AppEnv,
  notFound,
  ok,
  parseBooleanFlag,
  requireAdmin,
  success,
  validate,
} from "./common";

const listQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
});

const locationIdSchema = z.object({
  id: z.string(),
});

export const locationsApi = new Hono<AppEnv>()
  .get("/", validate("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const locations = await LocationService.list({
      isActive: parseBooleanFlag(query.isActive),
    });

    return ok(c, locations);
  })
  .get("/:id/stock", validate("param", locationIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const location = await LocationService.byId(id);
    if (!location) {
      throw notFound("Location", id);
    }

    const stock = await StockService.getByLocation(id);
    return ok(c, stock);
  })
  .get("/:id", validate("param", locationIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const location = await LocationService.byId(id);
    if (!location) {
      throw notFound("Location", id);
    }

    return ok(c, location);
  })
  .post(
    "/",
    requireAdmin,
    validate("json", LocationService.CreateInput),
    async (c) => {
      const location = await LocationService.create(c.req.valid("json"));
      return ok(c, location, 201);
    },
  )
  .put(
    "/:id",
    requireAdmin,
    validate("param", locationIdSchema),
    validate("json", LocationService.UpdateInput.omit({ id: true })),
    async (c) => {
      const { id } = c.req.valid("param");
      const location = await LocationService.update({
        id,
        ...c.req.valid("json"),
      });

      return ok(c, location);
    },
  )
  .delete("/:id", requireAdmin, validate("param", locationIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await LocationService.remove(id);
    return success(c);
  });
