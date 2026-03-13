#!/usr/bin/env bun
/**
 * Verify Stock Consistency
 *
 * Ensures product list stock values match the sum of product_stock records.
 * Run after seed or when verifying the stock redesign.
 *
 * Usage:
 *   bun run packages/core/src/cli/verify-stock-consistency.ts
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 */

import { config } from "dotenv";
config();

import { db } from "../drizzle";
import { productStockTable } from "../stock/stock.sql";
import { sql } from "drizzle-orm";
import { ProductService } from "../product";

async function main() {
  console.log("Verifying stock consistency...\n");

  // 1. Get product list stock (same path as API) - paginate to fetch all
  const apiStockByProductId = new Map<string, number>();
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  while (hasMore) {
    const listResult = await ProductService.list({ limit, offset });
    for (const p of listResult.items) {
      apiStockByProductId.set(p.id, p.stock ?? 0);
    }
    hasMore = listResult.hasMore;
    offset += listResult.items.length;
  }

  // 2. Compute expected stock from product_stock (source of truth)
  const stockSums = await db
    .select({
      productId: productStockTable.productId,
      variantId: productStockTable.variantId,
      totalStock: sql<number>`COALESCE(SUM(${productStockTable.quantity}), 0)::int`,
    })
    .from(productStockTable)
    .groupBy(productStockTable.productId, productStockTable.variantId);

  // Build product total = sum of base stock (variantId null) + variant stock
  const directStockByProductId = new Map<string, number>();
  for (const s of stockSums) {
    const current = directStockByProductId.get(s.productId) ?? 0;
    directStockByProductId.set(s.productId, current + s.totalStock);
  }

  // 3. Compare
  const mismatches: { productId: string; apiStock: number; directStock: number }[] = [];
  const checked = new Set<string>();

  for (const [productId, apiStock] of apiStockByProductId) {
    checked.add(productId);
    const directStock = directStockByProductId.get(productId) ?? 0;
    if (apiStock !== directStock) {
      mismatches.push({ productId, apiStock, directStock });
    }
  }

  // Products with stock but not in list
  for (const [productId, directStock] of directStockByProductId) {
    if (!checked.has(productId) && directStock > 0) {
      mismatches.push({
        productId,
        apiStock: 0,
        directStock,
      });
    }
  }

  if (mismatches.length === 0) {
    console.log("✓ Stock consistency OK");
    console.log(`  Checked ${apiStockByProductId.size} products`);
    process.exit(0);
  }

  console.error("✗ Stock mismatches found:");
  for (const m of mismatches) {
    console.error(`  ${m.productId}: API=${m.apiStock} vs Direct=${m.directStock}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
