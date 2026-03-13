import { eq, and, sql, isNull, gt, lte, desc, asc, type SQL } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { productStockTable, stockMovementTable } from "./stock.sql";
import { locationTable } from "../location/location.sql";
import { supplierTable } from "../supplier/supplier.sql";
import { productTable } from "../product/product.sql";
import { NotFoundError, ValidationError } from "../error";
import { fn } from "../util/fn";
import { createID } from "../util/id";

export * from "./stock.sql";
export * from "./stock-actions";

export namespace StockService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Stock record ID" }),
      productId: z.string().meta({ description: "Product ID" }),
      variantId: z.string().nullable().meta({ description: "Variant ID" }),
      locationId: z.string().meta({ description: "Location ID" }),
      quantity: z.number().meta({ description: "Stock quantity" }),
      condition: z
        .enum(["new", "used", "refurbished"])
        .meta({ description: "Stock condition" }),
      costPrice: z
        .number()
        .nullable()
        .meta({ description: "Cost price per unit" }),
      reorderLevel: z
        .number()
        .nullable()
        .meta({ description: "Low stock threshold; alert when quantity falls at or below this" }),
      reorderQuantity: z
        .number()
        .nullable()
        .meta({ description: "Suggested quantity to order when restocking" }),
      supplierId: z
        .string()
        .nullable()
        .meta({ description: "Supplier ID" }),
      batchNumber: z
        .string()
        .nullable()
        .meta({ description: "Batch/lot number" }),
      lastRestockedAt: z
        .date()
        .nullable()
        .meta({ description: "Last restocked date" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "ProductStock", description: "Product stock at location" });

  export const StockWithLocation = Info.extend({
    location: z
      .object({
        id: z.string(),
        name: z.string(),
        address: z.string().nullable(),
      })
      .meta({ description: "Location details" }),
  }).meta({
    ref: "ProductStockWithLocation",
    description: "Stock with location info",
  });

  export const StockWithProductAndLocation = Info.extend({
    productName: z.string().meta({ description: "Product name" }),
    partNumber: z.string().meta({ description: "Product part number" }),
    locationName: z.string().meta({ description: "Location name" }),
  }).meta({
    ref: "ProductStockEnriched",
    description: "Stock row with product and location names for admin UI",
  });

  export const LocationWithStock = z
    .object({
      locationId: z.string().meta({ description: "Location ID" }),
      name: z.string().meta({ description: "Location name" }),
      address: z
        .string()
        .nullable()
        .meta({ description: "Location address" }),
      stock: z.number().meta({ description: "Available stock quantity" }),
    })
    .meta({
      ref: "LocationWithStock",
      description: "Location with stock info for pickup selection",
    });

  export const MovementInfo = z
    .object({
      id: z.string().meta({ description: "Movement ID" }),
      productStockId: z.string().meta({ description: "Stock record ID" }),
      productId: z.string().meta({ description: "Product ID" }),
      locationId: z.string().meta({ description: "Location ID" }),
      type: z
        .enum(["in", "out", "adjustment", "transfer", "return"])
        .meta({ description: "Movement type" }),
      quantity: z.number().meta({ description: "Quantity moved" }),
      reason: z.string().nullable().meta({ description: "Movement reason" }),
      referenceId: z
        .string()
        .nullable()
        .meta({ description: "Reference (order ID, transfer ID, etc.)" }),
      performedBy: z
        .string()
        .nullable()
        .meta({ description: "User who performed the action" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "StockMovement", description: "Inventory movement record" });

  export const ReorderAlert = z
    .object({
      stockId: z.string().meta({ description: "Stock record ID" }),
      productId: z.string().meta({ description: "Product ID" }),
      productName: z.string().meta({ description: "Product name" }),
      partNumber: z.string().meta({ description: "Part number" }),
      locationId: z.string().meta({ description: "Location ID" }),
      locationName: z.string().meta({ description: "Location name" }),
      quantity: z.number().meta({ description: "Current quantity" }),
      reorderLevel: z.number().meta({ description: "Low stock threshold" }),
      reorderQuantity: z.number().meta({ description: "Quantity to order when restocking" }),
      supplierName: z
        .string()
        .nullable()
        .meta({ description: "Supplier name" }),
    })
    .meta({ ref: "ReorderAlert", description: "Low stock reorder alert" });

  function assertWholeQuantity(quantity: number, field = "quantity") {
    if (!Number.isInteger(quantity)) {
      throw new ValidationError(`${field} must be a whole number`);
    }
  }

  function buildStockConditions(input: {
    productId: string;
    locationId: string;
    variantId?: string;
    condition?: "new" | "used" | "refurbished";
  }) {
    const conditions: SQL[] = [
      eq(productStockTable.productId, input.productId),
      eq(productStockTable.locationId, input.locationId),
    ];

    if (input.condition) {
      conditions.push(eq(productStockTable.condition, input.condition));
    }

    if (input.variantId) {
      conditions.push(eq(productStockTable.variantId, input.variantId));
    } else {
      conditions.push(isNull(productStockTable.variantId));
    }

    return conditions;
  }

  function normalizeMovement(
    type: "in" | "out" | "adjustment" | "transfer" | "return",
    quantity: number,
  ) {
    assertWholeQuantity(quantity);

    if (type === "transfer") {
      throw new ValidationError(
        "Transfer movements require both source and destination stock records",
      );
    }

    if (type === "adjustment") {
      if (quantity === 0) {
        throw new ValidationError("Adjustment quantity cannot be zero");
      }

      return {
        movementQuantity: quantity,
        balanceDelta: quantity,
      };
    }

    const absoluteQuantity = Math.abs(quantity);

    if (absoluteQuantity <= 0) {
      throw new ValidationError("Movement quantity must be greater than zero");
    }

    if (type === "in" || type === "return") {
      return {
        movementQuantity: absoluteQuantity,
        balanceDelta: absoluteQuantity,
      };
    }

    return {
      movementQuantity: absoluteQuantity,
      balanceDelta: -absoluteQuantity,
    };
  }

  export const getByProduct = fn(z.string(), async (productId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          id: productStockTable.id,
          productId: productStockTable.productId,
          variantId: productStockTable.variantId,
          locationId: productStockTable.locationId,
          quantity: productStockTable.quantity,
          condition: productStockTable.condition,
          costPrice: productStockTable.costPrice,
          reorderLevel: productStockTable.reorderLevel,
          reorderQuantity: productStockTable.reorderQuantity,
          supplierId: productStockTable.supplierId,
          batchNumber: productStockTable.batchNumber,
          lastRestockedAt: productStockTable.lastRestockedAt,
          createdAt: productStockTable.createdAt,
          updatedAt: productStockTable.updatedAt,
          location: {
            id: locationTable.id,
            name: locationTable.name,
            address: locationTable.address,
          },
        })
        .from(productStockTable)
        .innerJoin(
          locationTable,
          eq(productStockTable.locationId, locationTable.id),
        )
        .where(
          and(
            eq(productStockTable.productId, productId),
            isNull(productStockTable.variantId),
          ),
        );
    });
  });

  export const getByProductAndVariant = fn(
    z.object({ productId: z.string(), variantId: z.string() }),
    async ({ productId, variantId }) => {
      return withTransaction(async (tx) => {
        return tx
          .select({
            id: productStockTable.id,
            productId: productStockTable.productId,
            variantId: productStockTable.variantId,
            locationId: productStockTable.locationId,
          quantity: productStockTable.quantity,
          condition: productStockTable.condition,
          costPrice: productStockTable.costPrice,
          reorderLevel: productStockTable.reorderLevel,
            reorderQuantity: productStockTable.reorderQuantity,
            supplierId: productStockTable.supplierId,
            batchNumber: productStockTable.batchNumber,
            lastRestockedAt: productStockTable.lastRestockedAt,
            createdAt: productStockTable.createdAt,
            updatedAt: productStockTable.updatedAt,
            location: {
              id: locationTable.id,
              name: locationTable.name,
              address: locationTable.address,
            },
          })
          .from(productStockTable)
          .innerJoin(
            locationTable,
            eq(productStockTable.locationId, locationTable.id),
          )
          .where(
            and(
              eq(productStockTable.productId, productId),
              eq(productStockTable.variantId, variantId),
            ),
          );
      });
    },
  );

  export const getByLocation = fn(z.string(), async (locationId) => {
    return withTransaction(async (tx) => {
      return tx
        .select()
        .from(productStockTable)
        .where(eq(productStockTable.locationId, locationId));
    });
  });

  export const getByLocationEnriched = fn(z.string(), async (locationId) => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          id: productStockTable.id,
          productId: productStockTable.productId,
          variantId: productStockTable.variantId,
          locationId: productStockTable.locationId,
          quantity: productStockTable.quantity,
          condition: productStockTable.condition,
          costPrice: productStockTable.costPrice,
          reorderLevel: productStockTable.reorderLevel,
          reorderQuantity: productStockTable.reorderQuantity,
          supplierId: productStockTable.supplierId,
          batchNumber: productStockTable.batchNumber,
          lastRestockedAt: productStockTable.lastRestockedAt,
          createdAt: productStockTable.createdAt,
          updatedAt: productStockTable.updatedAt,
          productName: productTable.name,
          partNumber: productTable.partNumber,
          locationName: locationTable.name,
        })
        .from(productStockTable)
        .innerJoin(
          productTable,
          eq(productStockTable.productId, productTable.id),
        )
        .innerJoin(
          locationTable,
          eq(productStockTable.locationId, locationTable.id),
        )
        .where(eq(productStockTable.locationId, locationId));
    });
  });

  export const getForProductAtLocation = fn(
    z.object({
      productId: z.string(),
      locationId: z.string(),
      variantId: z.string().optional(),
    }),
    async ({ productId, locationId, variantId }) => {
      return withTransaction(async (tx) => {
        const conditions = [
          eq(productStockTable.productId, productId),
          eq(productStockTable.locationId, locationId),
        ];

        if (variantId) {
          conditions.push(eq(productStockTable.variantId, variantId));
        } else {
          conditions.push(isNull(productStockTable.variantId));
        }

        const [stock] = await tx
          .select()
          .from(productStockTable)
          .where(and(...conditions));

        return stock;
      });
    },
  );

  export const getTotalStock = fn(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
    }),
    async ({ productId, variantId }) => {
      return withTransaction(async (tx) => {
        const conditions = [eq(productStockTable.productId, productId)];

        if (variantId) {
          conditions.push(eq(productStockTable.variantId, variantId));
        } else {
          conditions.push(isNull(productStockTable.variantId));
        }

        const result = await tx
          .select({
            total: sql<number>`COALESCE(SUM(${productStockTable.quantity}), 0)`,
          })
          .from(productStockTable)
          .where(and(...conditions));

        return result[0]?.total ?? 0;
      });
    },
  );

  export const checkAvailability = fn(
    z.object({
      productId: z.string(),
      locationId: z.string(),
      quantity: z.number(),
      variantId: z.string().optional(),
    }),
    async ({ productId, locationId, quantity, variantId }) => {
      const stock = await getForProductAtLocation({
        productId,
        locationId,
        variantId,
      });
      return {
        available: (stock?.quantity ?? 0) >= quantity,
        currentStock: stock?.quantity ?? 0,
        requestedQuantity: quantity,
      };
    },
  );

  export const upsert = fn(
    z.object({
      productId: z.string(),
      locationId: z.string(),
      quantity: z.number(),
      variantId: z.string().optional(),
      condition: z.enum(["new", "used", "refurbished"]).optional(),
      costPrice: z.number().optional(),
      reorderLevel: z.number().optional(),
      reorderQuantity: z.number().optional(),
      supplierId: z.string().optional(),
      batchNumber: z.string().optional(),
    }),
    async (input) => {
      const {
        productId,
        locationId,
        quantity,
        variantId,
        condition = "new",
        ...extra
      } = input;
      assertWholeQuantity(quantity);
      if (quantity < 0) {
        throw new ValidationError("quantity cannot be negative");
      }

      return withTransaction(async (tx) => {
        const conditions = buildStockConditions({
          productId,
          locationId,
          variantId,
          condition,
        });

        const existing = await tx
          .select()
          .from(productStockTable)
          .where(and(...conditions));

        if (existing.length > 0 && existing[0]) {
          const previousQuantity = existing[0].quantity;
          const delta = quantity - previousQuantity;
          const [stock] = await tx
            .update(productStockTable)
            .set({
              quantity,
              lastRestockedAt: delta > 0 ? new Date() : existing[0].lastRestockedAt,
              ...extra,
            })
            .where(eq(productStockTable.id, existing[0].id))
            .returning();

          if (delta !== 0) {
            const movementId = createID("stock_movement");
            await tx.insert(stockMovementTable).values({
              id: movementId,
              productStockId: existing[0].id,
              productId,
              locationId,
              type: "adjustment",
              quantity: delta,
              reason: "Stock level updated via Add Stock",
            });
          }

          return { stock, created: false };
        }

        const id = createID("product_stock");
        const [stock] = await tx
          .insert(productStockTable)
          .values({
            id,
            productId,
            locationId,
            quantity,
            variantId,
            condition,
            lastRestockedAt: new Date(),
            ...extra,
          })
          .returning();

        if (quantity > 0) {
          const movementId = createID("stock_movement");
          await tx.insert(stockMovementTable).values({
            id: movementId,
            productStockId: id,
            productId,
            locationId,
            type: "in",
            quantity,
            reason: "Initial stock added",
          });
        }

        return { stock, created: true };
      });
    },
  );

  export const updateQuantity = fn(
    z.object({
      id: z.string(),
      quantity: z.number(),
      reason: z.string().optional(),
      referenceId: z.string().optional(),
      performedBy: z.string().optional(),
    }),
    async ({ id, quantity, reason, referenceId, performedBy }) => {
      assertWholeQuantity(quantity);
      if (quantity < 0) {
        throw new ValidationError("quantity cannot be negative");
      }

      return withTransaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(productStockTable)
          .where(eq(productStockTable.id, id));

        if (!existing) {
          throw new NotFoundError("ProductStock", id);
        }

        const delta = quantity - existing.quantity;
        const [stock] = await tx
          .update(productStockTable)
          .set({
            quantity,
            lastRestockedAt: delta > 0 ? new Date() : existing.lastRestockedAt,
          })
          .where(eq(productStockTable.id, id))
          .returning();

        if (delta !== 0) {
          const movementId = createID("stock_movement");
          await tx.insert(stockMovementTable).values({
            id: movementId,
            productStockId: existing.id,
            productId: existing.productId,
            locationId: existing.locationId,
            type: "adjustment",
            quantity: delta,
            reason: reason ?? "Quantity adjusted",
            referenceId,
            performedBy,
          });
        }

        return stock;
      });
    },
  );

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [stock] = await tx
        .delete(productStockTable)
        .where(eq(productStockTable.id, id))
        .returning();
      return stock;
    });
  });

  export const getLocationsWithStock = fn(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      minQuantity: z.number().optional().default(1),
    }),
    async ({ productId, variantId, minQuantity }) => {
      return withTransaction(async (tx) => {
        const conditions = [
          eq(productStockTable.productId, productId),
          gt(productStockTable.quantity, minQuantity - 1),
        ];

        if (variantId) {
          conditions.push(eq(productStockTable.variantId, variantId));
        } else {
          conditions.push(isNull(productStockTable.variantId));
        }

        return tx
          .select({
            locationId: locationTable.id,
            name: locationTable.name,
            address: locationTable.address,
            stock: productStockTable.quantity,
          })
          .from(productStockTable)
          .innerJoin(
            locationTable,
            eq(productStockTable.locationId, locationTable.id),
          )
          .where(and(...conditions));
      });
    },
  );

  // --- Warehouse Actions ---

  const receiveInputSchema = z.object({
    productStockId: z.string(),
    productId: z.string(),
    locationId: z.string(),
    quantity: z.number(),
    reason: z.string().optional(),
    referenceId: z.string().optional(),
    performedBy: z.string().optional(),
  });

  export const receive = fn(receiveInputSchema, async (input) => {
    return recordMovement({
      ...input,
      type: "in",
      reason: input.reason ?? "Stock received",
    });
  });

  const issueInputSchema = z.object({
    productStockId: z.string(),
    productId: z.string(),
    locationId: z.string(),
    quantity: z.number(),
    reason: z.string().optional(),
    referenceId: z.string().optional(),
    performedBy: z.string().optional(),
  });

  export const issue = fn(issueInputSchema, async (input) => {
    return recordMovement({
      ...input,
      type: "out",
      reason: input.reason ?? "Stock issued",
    });
  });

  const setCountedBalanceInputSchema = z.object({
    productStockId: z.string(),
    productId: z.string(),
    locationId: z.string(),
    newQuantity: z.number(),
    reason: z.string().optional(),
    referenceId: z.string().optional(),
    performedBy: z.string().optional(),
  });

  export const setCountedBalance = fn(setCountedBalanceInputSchema, async (input) => {
    const { newQuantity, ..._rest } = input;
    assertWholeQuantity(newQuantity);
    if (newQuantity < 0) {
      throw new ValidationError("Quantity cannot be negative");
    }

    return withTransaction(async (tx) => {
      const [stock] = await tx
        .select()
        .from(productStockTable)
        .where(eq(productStockTable.id, input.productStockId));

      if (!stock) {
        throw new NotFoundError("ProductStock", input.productStockId);
      }

      if (stock.productId !== input.productId || stock.locationId !== input.locationId) {
        throw new ValidationError("productId or locationId does not match the stock record");
      }

      const delta = newQuantity - stock.quantity;
      if (delta === 0) return stock;

      const [updated] = await tx
        .update(productStockTable)
        .set({
          quantity: newQuantity,
          lastRestockedAt: delta > 0 ? new Date() : stock.lastRestockedAt,
        })
        .where(eq(productStockTable.id, stock.id))
        .returning();

      const movementId = createID("stock_movement");
      await tx.insert(stockMovementTable).values({
        id: movementId,
        productStockId: stock.id,
        productId: stock.productId,
        locationId: stock.locationId,
        type: "adjustment",
        quantity: delta,
        reason: input.reason ?? "Stock count adjusted",
        referenceId: input.referenceId,
        performedBy: input.performedBy,
      });

      return updated;
    });
  });

  const transferInputSchema = z.object({
    sourceProductStockId: z.string(),
    sourceProductId: z.string(),
    sourceLocationId: z.string(),
    destProductStockId: z.string(),
    destProductId: z.string(),
    destLocationId: z.string(),
    quantity: z.number(),
    reason: z.string().optional(),
    referenceId: z.string().optional(),
    performedBy: z.string().optional(),
  });

  export const transfer = fn(transferInputSchema, async (input) => {
    assertWholeQuantity(input.quantity);
    if (input.quantity <= 0) {
      throw new ValidationError("Transfer quantity must be greater than zero");
    }
    if (input.sourceProductId !== input.destProductId) {
      throw new ValidationError("Source and destination must be the same product");
    }
    if (input.sourceLocationId === input.destLocationId) {
      throw new ValidationError("Source and destination must be different locations");
    }

    return withTransaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(productStockTable)
        .where(eq(productStockTable.id, input.sourceProductStockId));

      const [dest] = await tx
        .select()
        .from(productStockTable)
        .where(eq(productStockTable.id, input.destProductStockId));

      if (!source) {
        throw new NotFoundError("ProductStock", input.sourceProductStockId);
      }
      if (!dest) {
        throw new NotFoundError("ProductStock", input.destProductStockId);
      }

      if (source.productId !== input.sourceProductId || source.locationId !== input.sourceLocationId) {
        throw new ValidationError("Source stock record does not match");
      }
      if (dest.productId !== input.destProductId || dest.locationId !== input.destLocationId) {
        throw new ValidationError("Destination stock record does not match");
      }

      if (source.quantity < input.quantity) {
        throw new ValidationError("Insufficient stock at source for transfer");
      }

      await tx
        .update(productStockTable)
        .set({
          quantity: source.quantity - input.quantity,
        })
        .where(eq(productStockTable.id, source.id));

      await tx
        .update(productStockTable)
        .set({
          quantity: dest.quantity + input.quantity,
          lastRestockedAt: new Date(),
        })
        .where(eq(productStockTable.id, dest.id));

      const refId = input.referenceId ?? `transfer_${Date.now()}`;
      const reason = input.reason ?? "Transfer between locations";

      const outId = createID("stock_movement");
      await tx.insert(stockMovementTable).values({
        id: outId,
        productStockId: source.id,
        productId: source.productId,
        locationId: source.locationId,
        type: "out",
        quantity: input.quantity,
        reason,
        referenceId: refId,
        performedBy: input.performedBy,
      });

      const inId = createID("stock_movement");
      await tx.insert(stockMovementTable).values({
        id: inId,
        productStockId: dest.id,
        productId: dest.productId,
        locationId: dest.locationId,
        type: "in",
        quantity: input.quantity,
        reason,
        referenceId: refId,
        performedBy: input.performedBy,
      });

      return { transferred: input.quantity, referenceId: refId };
    });
  });

  // --- Stock Movements (legacy / audit) ---

  export const recordMovement = fn(
    z.object({
      productStockId: z.string(),
      productId: z.string(),
      locationId: z.string(),
      type: z.enum(["in", "out", "adjustment", "transfer", "return"]),
      quantity: z.number(),
      reason: z.string().optional(),
      referenceId: z.string().optional(),
      performedBy: z.string().optional(),
    }),
    async (input) => {
      const { movementQuantity, balanceDelta } = normalizeMovement(
        input.type,
        input.quantity,
      );

      return withTransaction(async (tx) => {
        const [stock] = await tx
          .select()
          .from(productStockTable)
          .where(eq(productStockTable.id, input.productStockId));

        if (!stock) {
          throw new NotFoundError("ProductStock", input.productStockId);
        }

        if (stock.productId !== input.productId) {
          throw new ValidationError("productId does not match the stock record");
        }

        if (stock.locationId !== input.locationId) {
          throw new ValidationError("locationId does not match the stock record");
        }

        const nextQuantity = stock.quantity + balanceDelta;
        if (nextQuantity < 0) {
          throw new ValidationError("Insufficient stock for this movement");
        }

        await tx
          .update(productStockTable)
          .set({
            quantity: nextQuantity,
            lastRestockedAt: balanceDelta > 0 ? new Date() : stock.lastRestockedAt,
          })
          .where(eq(productStockTable.id, stock.id));

        const id = createID("stock_movement");
        const [movement] = await tx
          .insert(stockMovementTable)
          .values({ id, ...input, quantity: movementQuantity })
          .returning();
        return movement;
      });
    },
  );

  export const getMovements = fn(
    z.object({
      productId: z.string().optional(),
      locationId: z.string().optional(),
      type: z
        .enum(["in", "out", "adjustment", "transfer", "return"])
        .optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const conditions: SQL[] = [];

        if (input.productId) {
          conditions.push(
            eq(stockMovementTable.productId, input.productId),
          );
        }
        if (input.locationId) {
          conditions.push(
            eq(stockMovementTable.locationId, input.locationId),
          );
        }
        if (input.type) {
          conditions.push(eq(stockMovementTable.type, input.type));
        }

        const query = tx
          .select()
          .from(stockMovementTable)
          .orderBy(desc(stockMovementTable.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        if (conditions.length > 0) {
          return query.where(and(...conditions));
        }
        return query;
      });
    },
  );

  // --- Reorder Alerts ---

  export const getReorderAlerts = fn(z.void(), async () => {
    return withTransaction(async (tx) => {
      return tx
        .select({
          stockId: productStockTable.id,
          productId: productStockTable.productId,
          productName: productTable.name,
          partNumber: productTable.partNumber,
          locationId: productStockTable.locationId,
          locationName: locationTable.name,
          quantity: productStockTable.quantity,
          reorderLevel: productStockTable.reorderLevel,
          reorderQuantity: productStockTable.reorderQuantity,
          supplierName: supplierTable.name,
        })
        .from(productStockTable)
        .innerJoin(
          productTable,
          eq(productStockTable.productId, productTable.id),
        )
        .innerJoin(
          locationTable,
          eq(productStockTable.locationId, locationTable.id),
        )
        .leftJoin(
          supplierTable,
          eq(productStockTable.supplierId, supplierTable.id),
        )
        .where(
          lte(
            productStockTable.quantity,
            sql`COALESCE(${productStockTable.reorderLevel}, 5)`,
          ),
        )
        .orderBy(asc(productStockTable.quantity));
    });
  });
}
