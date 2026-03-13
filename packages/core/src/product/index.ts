import {
  eq,
  and,
  isNull,
  asc,
  desc,
  inArray,
  sql,
  gte,
  lte,
  exists,
  or,
  ilike,
} from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import {
  productTable,
  productVariantTable,
} from "./product.sql";
import { categoryTable } from "../category/category.sql";
import { brandTable } from "../brand/brand.sql";
import { productStockTable } from "../stock/stock.sql";
import { productCompatibilityTable } from "../equipment/equipment.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./product.sql";

/** Shared aggregation: compute total and per-variant stock from product_stock records. */
function aggregateProductStock(
  variants: { id: string }[],
  stockRecords: { variantId: string | null; totalStock: number }[],
): { totalStock: number; variantStockMap: Map<string, number> } {
  const variantStockMap = new Map<string, number>();
  let productStock = 0;

  for (const s of stockRecords) {
    if (s.variantId) {
      variantStockMap.set(s.variantId, s.totalStock);
    } else {
      productStock = s.totalStock;
    }
  }

  const totalStock =
    variants.length > 0
      ? variants.reduce(
          (sum, v) => sum + (variantStockMap.get(v.id) ?? 0),
          0,
        )
      : productStock;

  return { totalStock, variantStockMap };
}

export namespace ProductService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Product ID" }),
      name: z.string().meta({ description: "Product name" }),
      slug: z.string().meta({ description: "URL-friendly slug" }),
      partNumber: z.string().meta({ description: "Unique part number" }),
      oemNumber: z
        .string()
        .nullable()
        .meta({ description: "OEM reference number" }),
      description: z
        .string()
        .nullable()
        .meta({ description: "Full description" }),
      shortDescription: z
        .string()
        .nullable()
        .meta({ description: "Short description" }),
      price: z.number().meta({ description: "Retail price" }),
      wholesalePrice: z
        .number()
        .nullable()
        .meta({ description: "Wholesale/B2B price" }),
      costPrice: z
        .number()
        .nullable()
        .meta({ description: "Cost price" }),
      condition: z
        .enum(["new", "used", "refurbished", "aftermarket"])
        .meta({ description: "Part condition" }),
      images: z
        .array(z.string())
        .meta({ description: "Product image URLs" }),
      categoryId: z.string().nullable().meta({ description: "Category ID" }),
      brandId: z.string().nullable().meta({ description: "Brand ID" }),
      sku: z.string().nullable().meta({ description: "Stock keeping unit" }),
      stock: z.number().meta({ description: "Available stock quantity" }),
      unit: z
        .string()
        .nullable()
        .meta({ description: "Unit of measurement" }),
      weight: z.number().nullable().meta({ description: "Product weight" }),
      weightUnit: z
        .string()
        .nullable()
        .meta({ description: "Weight unit (kg, g, lb)" }),
      specifications: z
        .record(z.string(), z.string())
        .nullable()
        .meta({ description: "Technical specifications" }),
      crossReferences: z
        .array(z.string())
        .meta({ description: "Cross-reference part numbers" }),
      minOrderQuantity: z
        .number()
        .meta({ description: "Minimum order quantity" }),
      warranty: z
        .string()
        .nullable()
        .meta({ description: "Warranty terms" }),
      leadTimeDays: z
        .number()
        .nullable()
        .meta({ description: "Lead time in days" }),
      isActive: z.boolean().meta({ description: "Product is active" }),
      meta: z
        .record(z.string(), z.string())
        .nullable()
        .meta({ description: "Additional metadata" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Product", description: "Spare part product" });

  export const VariantInfo = z
    .object({
      id: z.string().meta({ description: "Variant ID" }),
      productId: z.string().meta({ description: "Parent product ID" }),
      name: z.string().meta({ description: "Variant name" }),
      partNumber: z
        .string()
        .nullable()
        .meta({ description: "Variant part number" }),
      sku: z.string().nullable().meta({ description: "SKU" }),
      price: z.number().nullable().meta({ description: "Variant price" }),
      stock: z.number().meta({ description: "Stock quantity" }),
      condition: z
        .enum(["new", "used", "refurbished", "aftermarket"])
        .nullable()
        .meta({ description: "Variant condition" }),
      images: z
        .array(z.string())
        .meta({ description: "Variant image URLs" }),
      attributes: z
        .record(z.string(), z.string())
        .nullable()
        .meta({ description: "Variant attributes (grade, origin, etc.)" }),
      isDefault: z.boolean().meta({ description: "Is default variant" }),
      sortOrder: z
        .number()
        .nullable()
        .meta({ description: "Display order" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "ProductVariant", description: "Product variant" });

  export const CategoryInfo = z
    .object({
      id: z.string().meta({ description: "Category ID" }),
      name: z.string().meta({ description: "Category name" }),
      slug: z.string().meta({ description: "Category slug" }),
    })
    .meta({
      ref: "ProductCategory",
      description: "Product category summary",
    });

  export const BrandInfo = z
    .object({
      id: z.string().meta({ description: "Brand ID" }),
      name: z.string().meta({ description: "Brand name" }),
      slug: z.string().meta({ description: "Brand slug" }),
      logo: z.string().nullable().meta({ description: "Brand logo URL" }),
    })
    .meta({ ref: "ProductBrand", description: "Product brand/manufacturer summary" });

  export const ProductWithDetails = Info.extend({
    variants: z.array(VariantInfo).meta({ description: "Product variants" }),
    category: CategoryInfo.nullable().meta({
      description: "Product category",
    }),
    brand: BrandInfo.nullable().meta({ description: "Product brand" }),
  }).meta({
    ref: "ProductWithDetails",
    description: "Product with variants, category, and brand",
  });

  export const ProductListItem = Info.extend({
    variants: z.array(VariantInfo).meta({ description: "Product variants" }),
    category: CategoryInfo.nullable().meta({
      description: "Product category",
    }),
    brand: BrandInfo.nullable().meta({ description: "Product brand" }),
  }).meta({
    ref: "ProductListItem",
    description: "Product in list with variants, category and brand",
  });

  export const PaginatedProductList = z
    .object({
      items: z
        .array(ProductListItem)
        .meta({ description: "List of products" }),
      total: z.number().meta({ description: "Total number of products" }),
      limit: z.number().meta({ description: "Number of items per page" }),
      offset: z.number().meta({ description: "Current offset" }),
      hasMore: z
        .boolean()
        .meta({ description: "Whether there are more items" }),
    })
    .meta({
      ref: "PaginatedProductList",
      description: "Paginated list of products with category and brand",
    });

  export interface FilterCategory {
    id: string;
    name: string;
    slug: string;
    count: number;
    children: FilterCategory[];
  }

  const FilterCategorySchema: z.ZodType<FilterCategory> = z.lazy(() =>
    z.object({
      id: z.string().meta({ description: "Category ID" }),
      name: z.string().meta({ description: "Category name" }),
      slug: z.string().meta({ description: "Category slug" }),
      count: z
        .number()
        .meta({ description: "Product count (includes subcategories)" }),
      children: z
        .array(FilterCategorySchema)
        .meta({ description: "Subcategories" }),
    }),
  );

  export const FilterOptions = z
    .object({
      categories: z
        .array(FilterCategorySchema)
        .meta({ description: "Category tree with product counts" }),
      brands: z
        .array(
          z.object({
            id: z.string().meta({ description: "Brand ID" }),
            name: z.string().meta({ description: "Brand name" }),
            slug: z.string().meta({ description: "Brand slug" }),
            count: z.number().meta({ description: "Product count" }),
          }),
        )
        .meta({ description: "Brands with product counts" }),
      conditions: z
        .array(
          z.object({
            value: z.string().meta({ description: "Condition value" }),
            count: z.number().meta({ description: "Product count" }),
          }),
        )
        .meta({ description: "Conditions with product counts" }),
      priceRange: z
        .object({
          min: z.number().meta({ description: "Minimum price" }),
          max: z.number().meta({ description: "Maximum price" }),
        })
        .meta({ description: "Price range of all products" }),
    })
    .meta({
      ref: "ProductFilterOptions",
      description: "Available filter options with product counts",
    });

  export const CreateInput = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    partNumber: z.string().min(1).max(100),
    oemNumber: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    price: z.number().min(0),
    wholesalePrice: z.number().optional(),
    costPrice: z.number().optional(),
    condition: z
      .enum(["new", "used", "refurbished", "aftermarket"])
      .optional(),
    images: z.array(z.string()).optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    sku: z.string().optional(),
    stock: z.number().optional(),
    unit: z.string().optional(),
    weight: z.number().optional(),
    weightUnit: z.string().optional(),
    specifications: z.record(z.string(), z.string()).optional(),
    crossReferences: z.array(z.string()).optional(),
    minOrderQuantity: z.number().optional(),
    warranty: z.string().optional(),
    leadTimeDays: z.number().optional(),
    isActive: z.boolean().optional(),
  });

  export const UpdateInput = CreateInput.partial().extend({
    id: z.string(),
  });

  export const ListInput = z
    .object({
      categoryId: z
        .string()
        .optional()
        .meta({ description: "Filter by category ID" }),
      brandId: z
        .string()
        .optional()
        .meta({ description: "Filter by brand ID" }),
      condition: z
        .enum(["new", "used", "refurbished", "aftermarket"])
        .optional()
        .meta({ description: "Filter by condition" }),
      isActive: z
        .boolean()
        .optional()
        .meta({ description: "Filter by active status" }),
      search: z.string().optional().meta({ description: "Search term (name, part number, OEM number, cross-references)" }),
      partNumber: z
        .string()
        .optional()
        .meta({ description: "Exact or partial part number match" }),
      equipmentId: z
        .string()
        .optional()
        .meta({ description: "Filter by compatible equipment ID" }),
      minPrice: z
        .number()
        .min(0)
        .optional()
        .meta({ description: "Minimum price filter" }),
      maxPrice: z
        .number()
        .min(0)
        .optional()
        .meta({ description: "Maximum price filter" }),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .meta({ description: "Limit results (default: 20, max: 100)" }),
      offset: z
        .number()
        .min(0)
        .default(0)
        .meta({ description: "Offset for pagination (default: 0)" }),
      sortBy: z
        .enum(["name", "price", "partNumber", "createdAt"])
        .optional()
        .meta({ description: "Sort field" }),
      sortOrder: z
        .enum(["asc", "desc"])
        .optional()
        .meta({ description: "Sort order" }),
    })
    .meta({
      ref: "ProductListInput",
      description: "Product list filter input",
    });

  export const ListQueryInput = z
    .object({
      categoryId: z
        .string()
        .optional()
        .meta({ description: "Filter by category ID" }),
      brandId: z
        .string()
        .optional()
        .meta({ description: "Filter by brand ID" }),
      condition: z
        .enum(["new", "used", "refurbished", "aftermarket"])
        .optional()
        .meta({ description: "Filter by condition" }),
      isActive: z
        .enum(["true", "false"])
        .optional()
        .meta({ description: "Filter by active status" }),
      search: z.string().optional().meta({ description: "Search term" }),
      partNumber: z
        .string()
        .optional()
        .meta({ description: "Exact or partial part number match" }),
      equipmentId: z
        .string()
        .optional()
        .meta({ description: "Filter by compatible equipment ID" }),
      minPrice: z
        .string()
        .optional()
        .meta({ description: "Minimum price filter" }),
      maxPrice: z
        .string()
        .optional()
        .meta({ description: "Maximum price filter" }),
      limit: z
        .string()
        .optional()
        .meta({ description: "Limit results (default: 20, max: 100)" }),
      offset: z
        .string()
        .optional()
        .meta({ description: "Offset for pagination (default: 0)" }),
      sortBy: z
        .enum(["name", "price", "partNumber", "createdAt"])
        .optional()
        .meta({ description: "Sort field" }),
      sortOrder: z
        .enum(["asc", "desc"])
        .optional()
        .meta({ description: "Sort order" }),
    })
    .meta({
      ref: "ProductListQueryInput",
      description: "Product list query parameters",
    });

  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  export const list = fn(ListInput.optional(), async (input) => {
    return withTransaction(async (tx) => {
      const conditions = [isNull(productTable.deletedAt)];

      if (input?.categoryId) {
        const allCats = await tx
          .select({ id: categoryTable.id, parentId: categoryTable.parentId })
          .from(categoryTable);

        const descendantIds = new Set<string>([input.categoryId]);
        let added = true;
        while (added) {
          added = false;
          for (const cat of allCats) {
            if (cat.parentId && descendantIds.has(cat.parentId) && !descendantIds.has(cat.id)) {
              descendantIds.add(cat.id);
              added = true;
            }
          }
        }
        conditions.push(inArray(productTable.categoryId, Array.from(descendantIds)));
      }
      if (input?.brandId) {
        conditions.push(eq(productTable.brandId, input.brandId));
      }
      if (input?.condition) {
        conditions.push(eq(productTable.condition, input.condition));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(productTable.isActive, input.isActive));
      }
      if (input?.partNumber) {
        const partTerm = `%${input.partNumber}%`;
        conditions.push(
          or(
            ilike(productTable.partNumber, partTerm),
            ilike(productTable.oemNumber, partTerm),
          )!,
        );
      }
      if (input?.equipmentId) {
        conditions.push(
          exists(
            tx
              .select({ one: sql`1` })
              .from(productCompatibilityTable)
              .where(
                and(
                  eq(productCompatibilityTable.productId, productTable.id),
                  eq(productCompatibilityTable.equipmentId, input.equipmentId),
                ),
              ),
          ),
        );
      }
      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          sql`(
            ${productTable.name} ILIKE ${searchTerm}
            OR ${productTable.partNumber} ILIKE ${searchTerm}
            OR ${productTable.oemNumber} ILIKE ${searchTerm}
            OR ${productTable.description} ILIKE ${searchTerm}
            OR ${productTable.shortDescription} ILIKE ${searchTerm}
            OR ${productTable.crossReferences}::text ILIKE ${searchTerm}
            OR ${categoryTable.name} ILIKE ${searchTerm}
            OR ${brandTable.name} ILIKE ${searchTerm}
          )`,
        );
      }
      if (input?.minPrice !== undefined) {
        conditions.push(gte(productTable.price, input.minPrice));
      }
      if (input?.maxPrice !== undefined) {
        conditions.push(lte(productTable.price, input.maxPrice));
      }

      const sortColumn =
        input?.sortBy === "price"
          ? productTable.price
          : input?.sortBy === "name"
            ? productTable.name
            : input?.sortBy === "partNumber"
              ? productTable.partNumber
              : productTable.createdAt;

      const orderFn = input?.sortOrder === "asc" ? asc : desc;

      const limit = Math.min(input?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
      const offset = input?.offset ?? 0;

      const [countResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .leftJoin(brandTable, eq(productTable.brandId, brandTable.id))
        .where(and(...conditions));

      const total = countResult?.count ?? 0;

      const results = await tx
        .select({
          product: productTable,
          category: {
            id: categoryTable.id,
            name: categoryTable.name,
            slug: categoryTable.slug,
          },
          brand: {
            id: brandTable.id,
            name: brandTable.name,
            slug: brandTable.slug,
            logo: brandTable.logo,
          },
        })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .leftJoin(brandTable, eq(productTable.brandId, brandTable.id))
        .where(and(...conditions))
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);

      const productIds = results.map((r) => r.product.id);

      const allVariants =
        productIds.length > 0
          ? await tx
              .select()
              .from(productVariantTable)
              .where(inArray(productVariantTable.productId, productIds))
              .orderBy(asc(productVariantTable.sortOrder))
          : [];

      const variantsByProductId = new Map<string, typeof allVariants>();
      for (const variant of allVariants) {
        const existing = variantsByProductId.get(variant.productId) ?? [];
        existing.push(variant);
        variantsByProductId.set(variant.productId, existing);
      }

      const stockByProduct =
        productIds.length > 0
          ? await tx
              .select({
                productId: productStockTable.productId,
                variantId: productStockTable.variantId,
                totalStock: sql<number>`COALESCE(SUM(${productStockTable.quantity}), 0)::int`,
              })
              .from(productStockTable)
              .where(inArray(productStockTable.productId, productIds))
              .groupBy(productStockTable.productId, productStockTable.variantId)
          : [];

      const stockByProductId = new Map<
        string,
        { variantId: string | null; totalStock: number }[]
      >();
      for (const s of stockByProduct) {
        const arr = stockByProductId.get(s.productId) ?? [];
        arr.push({ variantId: s.variantId, totalStock: s.totalStock });
        stockByProductId.set(s.productId, arr);
      }

      const items = results.map((row) => {
        const variants = variantsByProductId.get(row.product.id) ?? [];
        const records = stockByProductId.get(row.product.id) ?? [];
        const { totalStock, variantStockMap } = aggregateProductStock(
          variants,
          records,
        );
        const variantsWithStock = variants.map((v) => ({
          ...v,
          stock: variantStockMap.get(v.id) ?? 0,
        }));

        return {
          ...row.product,
          stock: totalStock,
          variants: variantsWithStock,
          category: row.category?.id ? row.category : null,
          brand: row.brand?.id ? row.brand : null,
        };
      });

      return {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      };
    });
  });

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(productTable)
        .where(and(eq(productTable.id, id), isNull(productTable.deletedAt)));
      return product;
    });
  });

  export const bySlug = fn(z.string(), async (slug) => {
    return withTransaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(productTable)
        .where(
          and(eq(productTable.slug, slug), isNull(productTable.deletedAt)),
        );
      return product;
    });
  });

  /** Find product by part number, OEM number, or cross-reference */
  export const byPartNumber = fn(z.string(), async (partNum) => {
    return withTransaction(async (tx) => {
      const [result] = await tx
        .select({
          product: productTable,
          category: {
            id: categoryTable.id,
            name: categoryTable.name,
            slug: categoryTable.slug,
          },
          brand: {
            id: brandTable.id,
            name: brandTable.name,
            slug: brandTable.slug,
            logo: brandTable.logo,
          },
        })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .leftJoin(brandTable, eq(productTable.brandId, brandTable.id))
        .where(
          and(
            or(
              eq(productTable.partNumber, partNum),
              eq(productTable.oemNumber, partNum),
              sql`${productTable.crossReferences} @> ${JSON.stringify([partNum])}::jsonb`,
            ),
            isNull(productTable.deletedAt),
          ),
        );

      if (!result) return null;

      const variants = await tx
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, result.product.id))
        .orderBy(asc(productVariantTable.sortOrder));

      const stockRecords = await tx
        .select({
          variantId: productStockTable.variantId,
          totalStock: sql<number>`COALESCE(SUM(${productStockTable.quantity}), 0)::int`,
        })
        .from(productStockTable)
        .where(eq(productStockTable.productId, result.product.id))
        .groupBy(productStockTable.variantId);

      const { totalStock, variantStockMap } = aggregateProductStock(
        variants,
        stockRecords,
      );
      const variantsWithStock = variants.map((v) => ({
        ...v,
        stock: variantStockMap.get(v.id) ?? 0,
      }));

      return {
        ...result.product,
        stock: totalStock,
        variants: variantsWithStock,
        category: result.category?.id ? result.category : null,
        brand: result.brand?.id ? result.brand : null,
      };
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("product");
      const [product] = await tx
        .insert(productTable)
        .values({
          id,
          ...input,
        })
        .returning();
      return product;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      const [product] = await tx
        .update(productTable)
        .set(data)
        .where(eq(productTable.id, id))
        .returning();
      if (!product) throw new NotFoundError("Product", id);
      return product;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [product] = await tx
        .update(productTable)
        .set({ deletedAt: new Date() })
        .where(eq(productTable.id, id))
        .returning();
      if (!product) throw new NotFoundError("Product", id);
      return product;
    });
  });

  export const getVariants = fn(z.string(), async (productId) => {
    return withTransaction(async (tx) => {
      return tx
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, productId))
        .orderBy(asc(productVariantTable.sortOrder));
    });
  });

  export const createVariant = fn(
    z.object({
      productId: z.string(),
      name: z.string(),
      partNumber: z.string().optional(),
      sku: z.string().optional(),
      price: z.number().optional(),
      stock: z.number().optional(),
      condition: z
        .enum(["new", "used", "refurbished", "aftermarket"])
        .optional(),
      attributes: z.record(z.string(), z.string()).optional(),
      images: z.array(z.string()).optional(),
      isDefault: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const id = createID("product_variant");
        const [variant] = await tx
          .insert(productVariantTable)
          .values({ id, ...input })
          .returning();
        return variant;
      });
    },
  );

  export const updateVariant = fn(
    z.object({
      id: z.string(),
      productId: z.string().optional(),
      name: z.string().optional(),
      partNumber: z.string().optional(),
      sku: z.string().optional(),
      price: z.number().optional(),
      stock: z.number().optional(),
      condition: z
        .enum(["new", "used", "refurbished", "aftermarket"])
        .optional(),
      attributes: z.record(z.string(), z.string()).optional(),
      images: z.array(z.string()).optional(),
      isDefault: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }),
    async (input) => {
      const { id, ...data } = input;
      return withTransaction(async (tx) => {
        const [variant] = await tx
          .update(productVariantTable)
          .set(data)
          .where(eq(productVariantTable.id, id))
          .returning();
        if (!variant) throw new NotFoundError("ProductVariant", id);
        return variant;
      });
    },
  );

  export const byIdWithDetails = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [result] = await tx
        .select({
          product: productTable,
          category: {
            id: categoryTable.id,
            name: categoryTable.name,
            slug: categoryTable.slug,
          },
          brand: {
            id: brandTable.id,
            name: brandTable.name,
            slug: brandTable.slug,
            logo: brandTable.logo,
          },
        })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .leftJoin(brandTable, eq(productTable.brandId, brandTable.id))
        .where(and(eq(productTable.id, id), isNull(productTable.deletedAt)));

      if (!result) return null;

      const variants = await tx
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, id))
        .orderBy(asc(productVariantTable.sortOrder));

      const stockRecords = await tx
        .select({
          variantId: productStockTable.variantId,
          totalStock: sql<number>`COALESCE(SUM(${productStockTable.quantity}), 0)::int`,
        })
        .from(productStockTable)
        .where(eq(productStockTable.productId, id))
        .groupBy(productStockTable.variantId);

      const { totalStock, variantStockMap } = aggregateProductStock(
        variants,
        stockRecords,
      );
      const variantsWithStock = variants.map((v) => ({
        ...v,
        stock: variantStockMap.get(v.id) ?? 0,
      }));

      return {
        ...result.product,
        stock: totalStock,
        variants: variantsWithStock,
        category: result.category?.id ? result.category : null,
        brand: result.brand?.id ? result.brand : null,
      };
    });
  });

  export const bySlugWithDetails = fn(z.string(), async (slug) => {
    return withTransaction(async (tx) => {
      const [result] = await tx
        .select({
          product: productTable,
          category: {
            id: categoryTable.id,
            name: categoryTable.name,
            slug: categoryTable.slug,
          },
          brand: {
            id: brandTable.id,
            name: brandTable.name,
            slug: brandTable.slug,
            logo: brandTable.logo,
          },
        })
        .from(productTable)
        .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .leftJoin(brandTable, eq(productTable.brandId, brandTable.id))
        .where(
          and(eq(productTable.slug, slug), isNull(productTable.deletedAt)),
        );

      if (!result) return null;

      const variants = await tx
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, result.product.id))
        .orderBy(asc(productVariantTable.sortOrder));

      const stockRecords = await tx
        .select({
          variantId: productStockTable.variantId,
          totalStock: sql<number>`COALESCE(SUM(${productStockTable.quantity}), 0)::int`,
        })
        .from(productStockTable)
        .where(eq(productStockTable.productId, result.product.id))
        .groupBy(productStockTable.variantId);

      const { totalStock, variantStockMap } = aggregateProductStock(
        variants,
        stockRecords,
      );
      const variantsWithStock = variants.map((v) => ({
        ...v,
        stock: variantStockMap.get(v.id) ?? 0,
      }));

      return {
        ...result.product,
        stock: totalStock,
        variants: variantsWithStock,
        category: result.category?.id ? result.category : null,
        brand: result.brand?.id ? result.brand : null,
      };
    });
  });

  export const FilterQueryInput = z.object({
    categoryId: z.string().optional().meta({ description: "Filter options by category ID" }),
  }).meta({ ref: "ProductFilterQueryInput", description: "Query input for filter options" });

  export const getFilterOptions = fn(FilterQueryInput.optional(), async (input) => {
    return withTransaction(async (tx) => {
      const categoryId = input?.categoryId;

      const allCategories = await tx
        .select({
          id: categoryTable.id,
          name: categoryTable.name,
          slug: categoryTable.slug,
          parentId: categoryTable.parentId,
          sortOrder: categoryTable.sortOrder,
          count: sql<number>`count(${productTable.id})::int`,
        })
        .from(categoryTable)
        .leftJoin(
          productTable,
          and(
            eq(productTable.categoryId, categoryTable.id),
            isNull(productTable.deletedAt),
            eq(productTable.isActive, true),
          ),
        )
        .where(eq(categoryTable.isActive, true))
        .groupBy(
          categoryTable.id,
          categoryTable.name,
          categoryTable.slug,
          categoryTable.parentId,
          categoryTable.sortOrder,
        )
        .orderBy(asc(categoryTable.sortOrder), asc(categoryTable.name));

      const categoryMap = new Map<string, FilterCategory>();
      const rootCategories: FilterCategory[] = [];

      for (const cat of allCategories) {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count,
          children: [],
        });
      }

      for (const cat of allCategories) {
        const node = categoryMap.get(cat.id)!;
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!;
          parent.children.push(node);
        } else {
          rootCategories.push(node);
        }
      }

      const aggregateCounts = (node: FilterCategory): number => {
        let totalCount = node.count;
        for (const child of node.children) {
          totalCount += aggregateCounts(child);
        }
        node.count = totalCount;
        return totalCount;
      };

      for (const root of rootCategories) {
        aggregateCounts(root);
      }

      const filterEmptyCategories = (
        cats: FilterCategory[],
      ): FilterCategory[] => {
        return cats
          .filter((cat) => cat.count > 0)
          .map((cat) => ({
            ...cat,
            children: filterEmptyCategories(cat.children),
          }));
      };

      const categoriesTree = filterEmptyCategories(rootCategories);

      let descendantCategoryIds: string[] = [];
      if (categoryId) {
        const descendantIds = new Set<string>([categoryId]);
        let added = true;
        while (added) {
          added = false;
          for (const cat of allCategories) {
            if (cat.parentId && descendantIds.has(cat.parentId) && !descendantIds.has(cat.id)) {
              descendantIds.add(cat.id);
              added = true;
            }
          }
        }
        descendantCategoryIds = Array.from(descendantIds);
      }

      const brandJoinConditions = [
        eq(productTable.brandId, brandTable.id),
        isNull(productTable.deletedAt),
        eq(productTable.isActive, true),
      ];
      if (categoryId && descendantCategoryIds.length > 0) {
        brandJoinConditions.push(inArray(productTable.categoryId, descendantCategoryIds));
      }

      const brandsWithCount = await tx
        .select({
          id: brandTable.id,
          name: brandTable.name,
          slug: brandTable.slug,
          count: sql<number>`count(${productTable.id})::int`,
        })
        .from(brandTable)
        .leftJoin(
          productTable,
          and(...brandJoinConditions),
        )
        .where(eq(brandTable.isActive, true))
        .groupBy(brandTable.id, brandTable.name, brandTable.slug)
        .having(sql`count(${productTable.id}) > 0`)
        .orderBy(asc(brandTable.name));

      // Get condition counts
      const conditionBaseConditions = [
        isNull(productTable.deletedAt),
        eq(productTable.isActive, true),
      ];
      if (categoryId && descendantCategoryIds.length > 0) {
        conditionBaseConditions.push(inArray(productTable.categoryId, descendantCategoryIds));
      }

      const conditionsWithCount = await tx
        .select({
          value: productTable.condition,
          count: sql<number>`count(*)::int`,
        })
        .from(productTable)
        .where(and(...conditionBaseConditions))
        .groupBy(productTable.condition)
        .orderBy(asc(productTable.condition));

      // Get price range
      const priceRangeConditions = [
        isNull(productTable.deletedAt),
        eq(productTable.isActive, true),
      ];
      if (categoryId && descendantCategoryIds.length > 0) {
        priceRangeConditions.push(inArray(productTable.categoryId, descendantCategoryIds));
      }

      const [priceRange] = await tx
        .select({
          min: sql<number>`COALESCE(MIN(${productTable.price}), 0)::float`,
          max: sql<number>`COALESCE(MAX(${productTable.price}), 0)::float`,
        })
        .from(productTable)
        .where(and(...priceRangeConditions));

      return {
        categories: categoriesTree,
        brands: brandsWithCount,
        conditions: conditionsWithCount,
        priceRange: priceRange ?? { min: 0, max: 0 },
      };
    });
  });
}
