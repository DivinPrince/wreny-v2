# 1000hills Core Package - Agent Instructions

## Quick Reference

```bash
# Type check
bun tsc --noEmit

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Push schema (dev only)
bun run db:push
```

## Domain Service Pattern

Every domain has two files:
- `<domain>.sql.ts` - Drizzle table schema
- `index.ts` - Service namespace with Zod schemas and functions

### Schema File (`<domain>.sql.ts`)

```typescript
import { pgTable, text, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";

export const domainTable = pgTable("domain", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Domain = typeof domainTable.$inferSelect;
export type NewDomain = typeof domainTable.$inferInsert;
```

### Service File (`index.ts`) - CRITICAL PATTERNS

```typescript
import "zod-openapi/extend";  // REQUIRED - must be first import
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { useTransaction } from "../drizzle/transaction";
import { domainTable } from "./domain.sql";
import { fn } from "../util/fn";
import { createID } from "../util/id";
import { NotFoundError } from "../error";

export * from "./domain.sql";

export namespace DomainService {
  // INFO SCHEMA - Must have .meta() with ref
  export const Info = z.object({
    id: z.string().meta({ description: "Domain ID" }),
    name: z.string().meta({ description: "Domain name" }),
    slug: z.string().meta({ description: "URL-friendly slug" }),
    description: z.string().nullable().meta({ description: "Description" }),
    price: z.number().meta({ description: "Price" }),
    stock: z.number().meta({ description: "Stock quantity" }),
    isActive: z.boolean().meta({ description: "Is active" }),
    createdAt: z.date().meta({ description: "Created date" }),
    updatedAt: z.date().meta({ description: "Last updated" }),
  }).meta({ ref: "Domain", description: "Domain resource" });

  // INPUT SCHEMAS
  export const CreateInput = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    price: z.number().min(0),
    stock: z.number().optional(),
    isActive: z.boolean().optional(),
  });

  export const UpdateInput = CreateInput.partial().extend({
    id: z.string(),
  });

  // SERVICE FUNCTIONS
  export const byId = fn(z.string(), async (id) => {
    return useTransaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(domainTable)
        .where(eq(domainTable.id, id));
      return item;
    });
  });

  export const create = fn(CreateInput, async (input) => {
    return useTransaction(async (tx) => {
      const id = createID("domain");
      const [item] = await tx
        .insert(domainTable)
        .values({ id, ...input })
        .returning();
      return item;
    });
  });

  export const update = fn(UpdateInput, async (input) => {
    const { id, ...data } = input;
    return useTransaction(async (tx) => {
      const [item] = await tx
        .update(domainTable)
        .set(data)
        .where(eq(domainTable.id, id))
        .returning();
      if (!item) throw new NotFoundError("Domain", id);
      return item;
    });
  });

  export const remove = fn(z.string(), async (id) => {
    return useTransaction(async (tx) => {
      const [item] = await tx
        .delete(domainTable)
        .where(eq(domainTable.id, id))
        .returning();
      if (!item) throw new NotFoundError("Domain", id);
      return item;
    });
  });
}
```

## OpenAPI Schema Rules

1. **ALWAYS add `import "zod-openapi/extend"` as first import**

2. **ALWAYS add `.meta()` to Info schemas:**
   ```typescript
   export const Info = z.object({ ... })
     .meta({ ref: "Domain", description: "..." });
   ```

3. **Add descriptions to fields:**
   ```typescript
   id: z.string().meta({ description: "Unique identifier" })
   ```

4. **For nested schemas, create separate named schemas:**
   ```typescript
   export const ItemInfo = z.object({ ... })
     .meta({ ref: "DomainItem", description: "..." });
   
   export const WithItems = Info.extend({
     items: z.array(ItemInfo),
   }).meta({ ref: "DomainWithItems", description: "..." });
   ```

## ID Prefixes

Use consistent prefixes for each domain:

```typescript
createID("product")      // product_01HQ...
createID("order")        // order_01HQ...
createID("order_item")   // order_item_01HQ...
createID("cart")         // cart_01HQ...
createID("cart_item")    // cart_item_01HQ...
createID("category")     // category_01HQ...
createID("brand")        // brand_01HQ...
createID("address")      // address_01HQ...
createID("wishlist")     // wishlist_01HQ...
```

## Error Handling

```typescript
import { NotFoundError, VisibleError } from "../error";

// Not found
throw new NotFoundError("Product", id);

// Custom visible error
throw new VisibleError(
  "validation_error",  // type
  "INVALID_INPUT",     // code
  "Email already exists"  // message
);
```

## Common Patterns

### Nullable fields
```typescript
description: z.string().nullable().meta({ description: "..." })
```

### Optional input fields
```typescript
description: z.string().optional()
```

### Array fields
```typescript
images: z.array(z.string()).meta({ description: "Image URLs" })
tags: z.array(z.string()).meta({ description: "Tags" })
```

### Enum fields
```typescript
status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"])
  .meta({ description: "Order status" })
```

### JSON fields (use record or custom schema)
```typescript
attributes: z.record(z.string(), z.string()).nullable().meta({ description: "Key-value attributes" })
```

## Adding a New Domain

1. Create `packages/core/src/<domain>/<domain>.sql.ts`:
   - Define Drizzle table schema
   - Export types

2. Create `packages/core/src/<domain>/index.ts`:
   - Import `"zod-openapi/extend"` first
   - Create namespace with Info schema (with `.meta()`)
   - Add CreateInput, UpdateInput schemas
   - Implement service functions

3. Export from `packages/core/src/index.ts`:
   ```typescript
   export * from "./<domain>";
   ```

4. Run type check: `bun tsc --noEmit`

5. Generate migrations if needed: `bun run db:generate`
