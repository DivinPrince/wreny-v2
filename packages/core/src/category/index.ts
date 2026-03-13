import { eq, isNull, asc, and, SQL } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../drizzle/transaction";
import { categoryTable } from "./category.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./category.sql";

export namespace CategoryService {
  export const Info = z
    .object({
      id: z.string().meta({ description: "Category ID" }),
      name: z.string().meta({ description: "Category name" }),
      slug: z.string().meta({ description: "URL-friendly slug" }),
      description: z
        .string()
        .nullable()
        .meta({ description: "Category description" }),
      image: z
        .string()
        .nullable()
        .meta({ description: "Category image URL" }),
      icon: z.string().nullable().meta({ description: "Category icon" }),
      parentId: z
        .string()
        .nullable()
        .meta({ description: "Parent category ID" }),
      sortOrder: z
        .number()
        .nullable()
        .meta({ description: "Display order" }),
      isActive: z.boolean().meta({ description: "Is category active" }),
      createdAt: z.date().meta({ description: "Created date" }),
      updatedAt: z.date().meta({ description: "Last updated" }),
    })
    .meta({ ref: "Category", description: "Product category" });

  const CategoryTreeNodeSchema = z.lazy(() =>
    z.object({
      id: z.string().meta({ description: "Category ID" }),
      name: z.string().meta({ description: "Category name" }),
      slug: z.string().meta({ description: "URL-friendly slug" }),
      description: z
        .string()
        .nullable()
        .meta({ description: "Category description" }),
      image: z
        .string()
        .nullable()
        .meta({ description: "Category image URL" }),
      icon: z.string().nullable().meta({ description: "Category icon" }),
      sortOrder: z
        .number()
        .nullable()
        .meta({ description: "Display order" }),
      isActive: z.boolean().meta({ description: "Is category active" }),
      children: z
        .array(CategoryTreeNodeSchema)
        .meta({ description: "Subcategories" }),
    }),
  );

  // Recursive category tree type
  export type CategoryTreeNode = z.infer<typeof CategoryTreeNodeSchema>;

  export const CategoryTree = z
    .array(CategoryTreeNodeSchema)
    .meta({
      ref: "CategoryTree",
      description: "Hierarchical category tree",
    });

  export const CreateInput = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  });

  export const UpdateInput = CreateInput.partial().extend({
    id: z.string(),
  });

  export const list = fn(
    z
      .object({
        parentId: z.string().nullish(),
        isActive: z.boolean().optional(),
      })
      .optional(),
    async (input) => {
      return withTransaction(async (tx) => {
        const conditions: SQL<unknown>[] = [];

        if (input?.parentId === null) {
          conditions.push(isNull(categoryTable.parentId));
        } else if (input?.parentId) {
          conditions.push(eq(categoryTable.parentId, input.parentId));
        }

        if (input?.isActive !== undefined) {
          conditions.push(eq(categoryTable.isActive, input.isActive));
        }

        const query = tx
          .select()
          .from(categoryTable)
          .orderBy(asc(categoryTable.sortOrder), asc(categoryTable.name));

        if (conditions.length > 0) {
          return query.where(and(...conditions));
        }
        return query;
      });
    },
  );

  export const byId = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const [category] = await tx
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.id, id));
      return category;
    });
  });

  export const bySlug = fn(z.string(), async (slug) => {
    return withTransaction(async (tx) => {
      const [category] = await tx
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.slug, slug));
      return category;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return withTransaction(async (tx) => {
      const id = createID("category");
      const categories = await tx
        .insert(categoryTable)
        .values({
          id,
          ...input,
        })
        .returning();
      return categories[0];
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return withTransaction(async (tx) => {
      const [category] = await tx
        .update(categoryTable)
        .set(data)
        .where(eq(categoryTable.id, id))
        .returning();
      if (!category) throw new NotFoundError("Category", id);
      return category;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return withTransaction(async (tx) => {
      const categories = await tx
        .delete(categoryTable)
        .where(eq(categoryTable.id, id))
        .returning();
      const category = categories[0];
      if (!category) throw new NotFoundError("Category", id);
      return category;
    });
  });

  /**
   * Get categories as a hierarchical tree
   */
  export const listTree = fn(
    z.object({ isActive: z.boolean().optional() }).optional(),
    async (input) => {
      return withTransaction(async (tx) => {
        const conditions: SQL[] = [];

        if (input?.isActive !== undefined) {
          conditions.push(eq(categoryTable.isActive, input.isActive));
        }

        const query = tx
          .select()
          .from(categoryTable)
          .orderBy(asc(categoryTable.sortOrder), asc(categoryTable.name));

        const allCategories =
          conditions.length > 0
            ? await query.where(and(...conditions))
            : await query;

        // Build tree structure
        const categoryMap = new Map<string, CategoryTreeNode>();
        const rootCategories: CategoryTreeNode[] = [];

        // First pass: create all category nodes
        for (const cat of allCategories) {
          categoryMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.image,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive,
            children: [],
          });
        }

        // Second pass: build tree structure
        for (const cat of allCategories) {
          const node = categoryMap.get(cat.id)!;
          if (cat.parentId && categoryMap.has(cat.parentId)) {
            const parent = categoryMap.get(cat.parentId)!;
            parent.children.push(node);
          } else {
            rootCategories.push(node);
          }
        }

        return rootCategories;
      });
    },
  );
}
