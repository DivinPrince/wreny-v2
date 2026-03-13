/**
 * Sample Spare Parts Seed Script
 *
 * Seeds the database with realistic spare parts data across multiple
 * industries: construction, energy/solar, security/IT, and generators.
 *
 * Run with: bun run db:seed:sample-products
 */

import { eq } from "drizzle-orm";
import { withTransaction } from "../drizzle/transaction";
import { productTable } from "../product/product.sql";
import { categoryTable } from "../category/category.sql";
import { brandTable } from "../brand/brand.sql";
import { supplierTable } from "../supplier/supplier.sql";
import { equipmentTable, productCompatibilityTable } from "../equipment/equipment.sql";
import { productStockTable } from "../stock/stock.sql";
import { locationTable } from "../location/location.sql";
import { createID } from "../util/id";
import type { ProductCondition } from "../product/product.sql";

interface SampleProduct {
  name: string;
  partNumber: string;
  oemNumber?: string;
  sku: string;
  price: number;
  wholesalePrice?: number;
  costPrice?: number;
  condition: ProductCondition;
  category: string;
  brand: string;
  specifications?: Record<string, string>;
  crossReferences?: string[];
  warranty?: string;
  leadTimeDays?: number;
  unit?: string;
  weight?: number;
  minOrderQuantity?: number;
}

function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

const sampleProducts: SampleProduct[] = [
  // --- Construction Tools & Parts ---
  {
    name: "Industrial Grade Rotary Hammer Drill",
    partNumber: "DRL-RH-001",
    oemNumber: "DW26500K",
    sku: "CN-71-001",
    price: 350000,
    wholesalePrice: 310000,
    costPrice: 280000,
    condition: "new",
    category: "construction-tools",
    brand: "dewalt",
    specifications: { "power": "1500W", "voltage": "220V", "chuck_size": "40mm", "weight": "11.8kg" },
    crossReferences: ["BOSCH-GBH-12-52D", "MAKITA-HR5212C"],
    warranty: "24 months",
    unit: "pc",
    weight: 12,
  },
  {
    name: "Heavy Duty Concrete Mixer 350L",
    partNumber: "MXR-HD-350",
    sku: "CN-71-003",
    price: 650000,
    wholesalePrice: 580000,
    costPrice: 500000,
    condition: "new",
    category: "construction-tools",
    brand: "generic",
    specifications: { "capacity": "350L", "motor": "2.2KW", "drum_speed": "28rpm", "voltage": "380V" },
    warranty: "12 months",
    unit: "pc",
    weight: 250,
    leadTimeDays: 14,
  },
  {
    name: "Diamond Core Drill Bit 102mm",
    partNumber: "BIT-DIA-102",
    sku: "CN-72-010",
    price: 45000,
    wholesalePrice: 38000,
    costPrice: 30000,
    condition: "new",
    category: "construction-tools",
    brand: "hilti",
    specifications: { "diameter": "102mm", "length": "450mm", "material": "Diamond-tipped", "thread": "1-1/4 UNC" },
    crossReferences: ["HUSQVARNA-D1235", "TYROLIT-DRY-102"],
    warranty: "6 months",
    unit: "pc",
    weight: 2,
    minOrderQuantity: 1,
  },
  {
    name: "Angle Grinder Replacement Disc 230mm",
    partNumber: "DSC-AG-230",
    sku: "CN-73-050",
    price: 3500,
    wholesalePrice: 2800,
    costPrice: 2000,
    condition: "new",
    category: "construction-tools",
    brand: "generic",
    specifications: { "diameter": "230mm", "thickness": "3mm", "bore": "22.2mm", "max_rpm": "6600" },
    warranty: "No warranty",
    unit: "pc",
    weight: 0,
    minOrderQuantity: 10,
  },

  // --- Energy & Solar ---
  {
    name: "450W Monocrystalline Solar Panel",
    partNumber: "PNL-MONO-450",
    oemNumber: "JA-JAM72S30-450",
    sku: "EN-07-136",
    price: 119000,
    wholesalePrice: 105000,
    costPrice: 90000,
    condition: "new",
    category: "solar-energy",
    brand: "ja-solar",
    specifications: { "power": "450W", "voltage_mpp": "41.52V", "current_mpp": "10.84A", "efficiency": "20.7%", "cells": "144 Half-cut" },
    crossReferences: ["LONGI-LR4-72HPH-450M", "TRINA-TSM-450DE09.08"],
    warranty: "25 years",
    unit: "pc",
    weight: 24,
    minOrderQuantity: 5,
  },
  {
    name: "5KW Lithium Solar Storage Battery",
    partNumber: "BAT-LI-5KW",
    oemNumber: "BYD-HVS-5.1",
    sku: "EN-07-998",
    price: 2100000,
    wholesalePrice: 1900000,
    costPrice: 1700000,
    condition: "new",
    category: "solar-energy",
    brand: "byd",
    specifications: { "capacity": "5.12kWh", "voltage": "51.2V", "chemistry": "LiFePO4", "cycles": "6000+", "depth_of_discharge": "100%" },
    warranty: "10 years",
    unit: "pc",
    weight: 58,
    leadTimeDays: 21,
  },
  {
    name: "10KW Hybrid Solar Inverter",
    partNumber: "INV-HYB-10K",
    sku: "EN-08-200",
    price: 1800000,
    wholesalePrice: 1600000,
    costPrice: 1350000,
    condition: "new",
    category: "solar-energy",
    brand: "growatt",
    specifications: { "power": "10KW", "input_voltage": "150-1000VDC", "output_voltage": "220/380V", "mppt_trackers": "2", "battery_voltage": "48V" },
    crossReferences: ["GOODWE-GW10K-ET", "DEYE-SUN-10K-SG04LP3"],
    warranty: "60 months",
    unit: "pc",
    weight: 35,
  },
  {
    name: "MC4 Solar Connector Pair",
    partNumber: "CON-MC4-PR",
    sku: "EN-09-300",
    price: 1500,
    wholesalePrice: 1000,
    costPrice: 600,
    condition: "new",
    category: "solar-energy",
    brand: "generic",
    specifications: { "rating": "30A 1000VDC", "wire_size": "4-6mm2", "ip_rating": "IP67" },
    warranty: "12 months",
    unit: "pair",
    minOrderQuantity: 20,
  },

  // --- Security & IT ---
  {
    name: "4K AI-Powered IP Surveillance Camera",
    partNumber: "CAM-4K-AI",
    oemNumber: "DS-2CD2T86G2-ISU",
    sku: "27-MRY-550",
    price: 83000,
    wholesalePrice: 72000,
    costPrice: 60000,
    condition: "new",
    category: "security-it",
    brand: "hikvision",
    specifications: { "resolution": "8MP (4K)", "lens": "2.8mm", "ir_range": "60m", "ip_rating": "IP67", "ai_features": "Face Detection, Line Crossing" },
    crossReferences: ["DAHUA-IPC-HFW5842T-ZE"],
    warranty: "36 months",
    unit: "pc",
    weight: 1,
  },
  {
    name: "32-Channel Network Video Recorder",
    partNumber: "NVR-32CH",
    oemNumber: "DS-7732NI-K4",
    sku: "77-NRV-121",
    price: 249000,
    wholesalePrice: 220000,
    costPrice: 185000,
    condition: "new",
    category: "security-it",
    brand: "hikvision",
    specifications: { "channels": "32", "resolution": "Up to 12MP", "bandwidth": "256Mbps", "hdd_bays": "4x SATA (up to 40TB)", "poe": "No (Standalone)" },
    warranty: "36 months",
    unit: "pc",
    weight: 5,
  },
  {
    name: "CAT6 UTP Cable 305m Box",
    partNumber: "CBL-CAT6-305",
    sku: "IT-10-100",
    price: 65000,
    wholesalePrice: 55000,
    costPrice: 42000,
    condition: "new",
    category: "security-it",
    brand: "generic",
    specifications: { "type": "CAT6 UTP", "length": "305m", "conductor": "23AWG Solid Copper", "jacket": "PVC" },
    warranty: "Lifetime",
    unit: "box",
    weight: 14,
    minOrderQuantity: 1,
  },

  // --- Generators & Power ---
  {
    name: "20KVA Diesel Generator Set",
    partNumber: "GEN-DSL-20K",
    sku: "PW-01-020",
    price: 4500000,
    wholesalePrice: 4100000,
    costPrice: 3500000,
    condition: "new",
    category: "generators",
    brand: "perkins",
    specifications: { "power": "20KVA / 16KW", "engine": "Perkins 404D-22G", "fuel": "Diesel", "voltage": "220/380V", "tank": "65L", "runtime": "8 hours at 75% load" },
    warranty: "24 months",
    unit: "set",
    weight: 620,
    leadTimeDays: 30,
  },
  {
    name: "Generator Oil Filter (Perkins 404D)",
    partNumber: "FLT-OIL-404D",
    oemNumber: "2654403",
    sku: "PW-02-050",
    price: 8500,
    wholesalePrice: 7000,
    costPrice: 5000,
    condition: "new",
    category: "generators",
    brand: "perkins",
    specifications: { "type": "Spin-on Oil Filter", "thread": "M20x1.5", "height": "97mm", "od": "76mm" },
    crossReferences: ["FLEETGUARD-LF3345", "DONALDSON-P550162", "MANN-W712/4"],
    warranty: "6 months",
    unit: "pc",
    minOrderQuantity: 5,
  },
  {
    name: "Generator Fuel Filter (Perkins 404D)",
    partNumber: "FLT-FUEL-404D",
    oemNumber: "26560201",
    sku: "PW-02-051",
    price: 12000,
    wholesalePrice: 10000,
    costPrice: 7500,
    condition: "new",
    category: "generators",
    brand: "perkins",
    specifications: { "type": "Fuel Filter Element", "height": "133mm", "od": "55mm" },
    crossReferences: ["FLEETGUARD-FF5135", "DONALDSON-P502420"],
    warranty: "6 months",
    unit: "pc",
    minOrderQuantity: 5,
  },
  {
    name: "Automatic Transfer Switch 100A",
    partNumber: "ATS-100A",
    sku: "PW-03-100",
    price: 320000,
    wholesalePrice: 280000,
    costPrice: 230000,
    condition: "new",
    category: "generators",
    brand: "generic",
    specifications: { "rating": "100A", "poles": "4P", "voltage": "380V", "switching_time": "<0.5s", "enclosure": "IP65" },
    warranty: "24 months",
    unit: "pc",
    weight: 15,
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function createCategoriesAndBrands() {
  return withTransaction(async (tx) => {
    const categories = [
      { name: "Construction Tools", slug: "construction-tools", description: "Heavy machinery, hand tools, and site equipment" },
      { name: "Solar & Energy", slug: "solar-energy", description: "Solar panels, batteries, inverters, and renewable energy components" },
      { name: "Security & IT", slug: "security-it", description: "Surveillance cameras, NVRs, networking, and IT equipment" },
      { name: "Generators & Power", slug: "generators", description: "Diesel/petrol generators, spare parts, and power transfer equipment" },
    ];

    const categoryIds: Record<string, string> = {};
    for (const cat of categories) {
      const id = createID("category");
      await tx
        .insert(categoryTable)
        .values({ id, name: cat.name, slug: cat.slug, description: cat.description, isActive: true })
        .onConflictDoNothing();

      const [existing] = await tx
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.slug, cat.slug));
      categoryIds[cat.slug] = existing?.id ?? id;
    }

    const brands = [
      { name: "DeWalt", slug: "dewalt" },
      { name: "Hilti", slug: "hilti" },
      { name: "JA Solar", slug: "ja-solar" },
      { name: "BYD", slug: "byd" },
      { name: "Growatt", slug: "growatt" },
      { name: "Hikvision", slug: "hikvision" },
      { name: "Perkins", slug: "perkins" },
      { name: "Generic", slug: "generic" },
    ];

    const brandIds: Record<string, string> = {};
    for (const brand of brands) {
      const id = createID("brand");
      await tx
        .insert(brandTable)
        .values({ id, name: brand.name, slug: brand.slug, isActive: true })
        .onConflictDoNothing();

      const [existing] = await tx
        .select()
        .from(brandTable)
        .where(eq(brandTable.slug, brand.slug));
      brandIds[brand.slug] = existing?.id ?? id;
    }

    return { categoryIds, brandIds };
  });
}

async function createSuppliersAndLocations() {
  return withTransaction(async (tx) => {
    const suppliers = [
      { name: "Kigali Industrial Supplies", slug: "kigali-industrial", city: "Kigali", country: "Rwanda" },
      { name: "East Africa Solar Distributors", slug: "ea-solar", city: "Nairobi", country: "Kenya" },
      { name: "China Direct Import Co.", slug: "china-direct", city: "Shenzhen", country: "China" },
    ];

    const supplierIds: Record<string, string> = {};
    for (const s of suppliers) {
      const id = createID("supplier");
      await tx
        .insert(supplierTable)
        .values({ id, name: s.name, slug: s.slug, city: s.city, country: s.country, isActive: true })
        .onConflictDoNothing();

      const [existing] = await tx
        .select()
        .from(supplierTable)
        .where(eq(supplierTable.slug, s.slug));
      supplierIds[s.slug] = existing?.id ?? id;
    }

    const locations = [
      { name: "Kigali Main Warehouse", address: "KG 500 St, Kicukiro" },
      { name: "Rubavu Branch", address: "Gisenyi Commercial Zone" },
    ];

    const locationIds: Record<string, string> = {};
    for (const loc of locations) {
      const id = createID("location");
      await tx
        .insert(locationTable)
        .values({ id, name: loc.name, address: loc.address, isActive: true })
        .onConflictDoNothing();

      const [existing] = await tx
        .select()
        .from(locationTable)
        .where(eq(locationTable.name, loc.name));
      locationIds[loc.name] = existing?.id ?? id;
    }

    return { supplierIds, locationIds };
  });
}

async function createEquipment() {
  return withTransaction(async (tx) => {
    const equipmentList = [
      { make: "Perkins", model: "404D-22G", type: "generator" as const, engineType: "4-cylinder Diesel" },
      { make: "Cummins", model: "4BT3.9", type: "generator" as const, engineType: "4-cylinder Diesel" },
      { make: "Toyota", model: "Hilux", type: "vehicle" as const, yearFrom: 2015, yearTo: 2024 },
      { make: "Caterpillar", model: "320 GC Excavator", type: "machinery" as const },
    ];

    const equipmentIds: Record<string, string> = {};
    for (const e of equipmentList) {
      const id = createID("equipment");
      await tx
        .insert(equipmentTable)
        .values({ id, ...e, isActive: true })
        .onConflictDoNothing();

      const [existing] = await tx
        .select()
        .from(equipmentTable)
        .where(eq(equipmentTable.model, e.model));
      const key = `${e.make}-${e.model}`;
      equipmentIds[key] = existing?.id ?? id;
    }

    return equipmentIds;
  });
}

async function main() {
  console.log("Seeding spare parts database...\n");

  try {
    const { categoryIds, brandIds } = await createCategoriesAndBrands();
    console.log("Created categories and brands\n");

    const { supplierIds, locationIds } = await createSuppliersAndLocations();
    console.log("Created suppliers and locations\n");

    const equipmentIds = await createEquipment();
    console.log("Created equipment entries\n");

    const kigaliId = locationIds["Kigali Main Warehouse"];
    const rubavuId = locationIds["Rubavu Branch"];
    const localSupplierId = supplierIds["kigali-industrial"];

    await withTransaction(async (tx) => {
      for (const product of sampleProducts) {
        const productId = createID("product");
        const categoryId = categoryIds[product.category];
        const brandId = brandIds[product.brand];

        await tx
          .insert(productTable)
          .values({
            id: productId,
            name: product.name,
            slug: slugify(product.name),
            partNumber: product.partNumber,
            oemNumber: product.oemNumber,
            price: toCents(product.price),
            wholesalePrice: product.wholesalePrice
              ? toCents(product.wholesalePrice)
              : undefined,
            costPrice: product.costPrice
              ? toCents(product.costPrice)
              : undefined,
            condition: product.condition,
            sku: product.sku,
            categoryId,
            brandId,
            specifications: product.specifications,
            crossReferences: product.crossReferences,
            warranty: product.warranty,
            leadTimeDays: product.leadTimeDays,
            unit: product.unit,
            weight: product.weight,
            minOrderQuantity: product.minOrderQuantity ?? 1,
            isActive: true,
            stock: Math.floor(Math.random() * 50) + 5,
          })
          .onConflictDoNothing();

        const [inserted] = await tx
          .select()
          .from(productTable)
          .where(eq(productTable.partNumber, product.partNumber));

        if (inserted && kigaliId) {
          const stockId = createID("product_stock");
          const qty = Math.floor(Math.random() * 40) + 5;
          await tx
            .insert(productStockTable)
            .values({
              id: stockId,
              productId: inserted.id,
              locationId: kigaliId,
              quantity: qty,
              condition: "new",
              costPrice: product.costPrice ? toCents(product.costPrice) : undefined,
              reorderLevel: Math.max(2, Math.floor(qty * 0.2)),
              reorderQuantity: Math.floor(qty * 0.5),
              supplierId: localSupplierId,
              lastRestockedAt: new Date(),
            })
            .onConflictDoNothing();
        }

        if (inserted && rubavuId && Math.random() > 0.4) {
          const stockId = createID("product_stock");
          const qty = Math.floor(Math.random() * 15) + 1;
          await tx
            .insert(productStockTable)
            .values({
              id: stockId,
              productId: inserted.id,
              locationId: rubavuId,
              quantity: qty,
              condition: "new",
              reorderLevel: 2,
              reorderQuantity: 5,
              lastRestockedAt: new Date(),
            })
            .onConflictDoNothing();
        }

        // Link generator parts to Perkins 404D equipment
        if (inserted && product.partNumber.includes("404D")) {
          const perkinsEquipId = equipmentIds["Perkins-404D-22G"];
          if (perkinsEquipId) {
            const compatId = createID("product_compatibility");
            await tx
              .insert(productCompatibilityTable)
              .values({
                id: compatId,
                productId: inserted.id,
                equipmentId: perkinsEquipId,
                notes: "Direct fit",
              })
              .onConflictDoNothing();
          }
        }

        console.log(`  [${product.partNumber}] ${product.name}`);
      }
    });

    console.log(`\nSuccessfully seeded ${sampleProducts.length} spare parts!`);
    console.log("\nCategories: Construction Tools, Solar & Energy, Security & IT, Generators & Power");
    console.log("Each part has: part numbers, specifications, cross-references, stock, and reorder levels");
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
