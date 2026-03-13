#!/usr/bin/env bun
/**
 * 1000 Hills Database Seed Script
 *
 * Generates realistic dummy data for product-related tables
 * using @faker-js/faker for randomized but realistic content.
 *
 * Usage:
 *   bun run db:seed
 *   bun run db:seed:clean   # Clear existing data before seeding
 *   bun run db:seed --help  # Show help
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 */

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
config();

import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { createID, generateULID } from "../util/id";

// ============================================================================
// Types
// ============================================================================

interface GeneratedCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  image: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

interface GeneratedBrand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  isActive: boolean;
}

interface GeneratedProduct {
  id: string;
  name: string;
  slug: string;
  partNumber: string;
  oemNumber: string | null;
  description: string;
  shortDescription: string;
  price: number;
  wholesalePrice: number | null;
  costPrice: number | null;
  condition: "new" | "used" | "refurbished" | "aftermarket";
  images: string[];
  categoryId: string;
  brandId: string;
  sku: string;
  stock: number;
  unit: string;
  weight: number;
  weightUnit: string;
  specifications: Record<string, string> | null;
  crossReferences: string[];
  minOrderQuantity: number;
  warranty: string | null;
  leadTimeDays: number | null;
  isActive: boolean;
}

interface GeneratedVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  attributes: Record<string, string>;
  images: string[];
  isDefault: boolean;
  sortOrder: number;
}

interface GeneratedLocation {
  id: string;
  name: string;
  address: string;
  landmark: string;
  mobile: string;
  email: string;
  website: string;
  isActive: boolean;
}

interface GeneratedStock {
  id: string;
  productId: string;
  condition: "new" | "used" | "refurbished";
  variantId: string | null;
  locationId: string;
  quantity: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  categories: {
    root: 8,
    subcategoriesPerRoot: { min: 3, max: 6 },
  },
  brands: 15,
  products: {
    total: 100,
    withVariants: 0.3,
    variantsPerProduct: { min: 2, max: 5 },
  },
  locations: 5,
  demoUsers: {
    admin: {
      email: process.env.SEED_ADMIN_EMAIL || "admin@1000hills.rw",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
      name: "Admin",
    },
    shopper: {
      email: process.env.SEED_SHOPPER_EMAIL || "shopper@1000hills.rw",
      password: process.env.SEED_SHOPPER_PASSWORD || "Shopper123!",
      name: "Demo Shopper",
    },
  },
};

// ============================================================================
// Image URL generators using picsum.photos for real images
// ============================================================================

const generateProductImage = (width = 640, height = 480) =>
  `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/${width}/${height}`;

const generateCategoryImage = (width = 400, height = 400) =>
  `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/${width}/${height}`;

const generateBrandLogo = (width = 200, height = 200) =>
  `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/${width}/${height}`;

// ============================================================================
// Grocery/E-commerce specific data
// ============================================================================

const GROCERY_CATEGORIES = [
  {
    name: "Fresh Produce",
    icon: "leaf",
    subcategories: [
      "Fruits",
      "Vegetables",
      "Organic",
      "Salads & Herbs",
      "Exotic Fruits",
    ],
  },
  {
    name: "Dairy & Eggs",
    icon: "milk",
    subcategories: ["Milk", "Cheese", "Yogurt", "Butter & Cream", "Eggs"],
  },
  {
    name: "Meat & Seafood",
    icon: "drumstick",
    subcategories: ["Beef", "Chicken", "Fish", "Lamb", "Seafood", "Deli Meats"],
  },
  {
    name: "Bakery",
    icon: "bread",
    subcategories: ["Bread", "Pastries", "Cakes", "Cookies", "Artisan Breads"],
  },
  {
    name: "Beverages",
    icon: "glass",
    subcategories: [
      "Water",
      "Soft Drinks",
      "Juices",
      "Tea & Coffee",
      "Energy Drinks",
    ],
  },
  {
    name: "Snacks & Confectionery",
    icon: "candy",
    subcategories: [
      "Chips & Crisps",
      "Chocolate",
      "Candy",
      "Nuts & Seeds",
      "Popcorn",
    ],
  },
  {
    name: "Pantry Essentials",
    icon: "jar",
    subcategories: [
      "Rice & Pasta",
      "Canned Goods",
      "Cooking Oils",
      "Spices & Seasonings",
      "Sauces",
    ],
  },
  {
    name: "Frozen Foods",
    icon: "snowflake",
    subcategories: [
      "Ice Cream",
      "Frozen Vegetables",
      "Frozen Meals",
      "Frozen Pizza",
      "Frozen Meat",
    ],
  },
];

const BRAND_NAMES = [
  "NatureFresh",
  "OrganicValley",
  "PureFarms",
  "GreenChoice",
  "HappyHarvest",
  "SunnyMeadows",
  "FreshStart",
  "NutriLife",
  "HomeGrown",
  "QualityFirst",
  "PrimeSelect",
  "DailyDelight",
  "FarmToTable",
  "CleanEats",
  "WholesomeGoods",
];

const PRODUCT_ADJECTIVES = [
  "Premium",
  "Organic",
  "Fresh",
  "Natural",
  "Farm-Fresh",
  "Artisan",
  "Homestyle",
  "Traditional",
  "Classic",
  "Gourmet",
];

const PRODUCT_UNITS = [
  "kg",
  "g",
  "lb",
  "oz",
  "ml",
  "L",
  "pcs",
  "pack",
  "bunch",
  "dozen",
];

const VARIANT_SIZES = ["100g", "250g", "500g", "1kg", "2kg"];
const VARIANT_PACKS = ["Single", "Twin Pack", "Family Pack", "Bulk Pack"];

// ============================================================================
// Helper functions
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePrice(): number {
  const basePrice = faker.number.float({
    min: 0.99,
    max: 99.99,
    fractionDigits: 2,
  });
  return Math.round(basePrice * 100);
}


// ============================================================================
// Data generators
// ============================================================================

function generateCategories(): GeneratedCategory[] {
  console.log("Generating categories...");
  const categories: GeneratedCategory[] = [];

  GROCERY_CATEGORIES.forEach((cat, rootIndex) => {
    const rootId = createID("category");

    categories.push({
      id: rootId,
      name: cat.name,
      slug: slugify(cat.name),
      parentId: null,
      description: faker.commerce.productDescription(),
      image: generateCategoryImage(),
      icon: cat.icon,
      sortOrder: rootIndex,
      isActive: true,
      isFeatured: rootIndex < 4,
    });

    cat.subcategories.forEach((subName, subIndex) => {
      categories.push({
        id: createID("category"),
        name: subName,
        slug: slugify(`${cat.name}-${subName}`),
        parentId: rootId,
        description: faker.commerce.productDescription(),
        image: generateCategoryImage(),
        icon: cat.icon,
        sortOrder: subIndex,
        isActive: true,
        isFeatured: false,
      });
    });
  });

  return categories;
}

function generateBrands(): GeneratedBrand[] {
  console.log("Generating brands...");

  return BRAND_NAMES.map((name) => ({
    id: createID("brand"),
    name,
    slug: slugify(name),
    logo: generateBrandLogo(),
    description: faker.company.catchPhrase(),
    isActive: true,
  }));
}

function generateProducts(
  categories: GeneratedCategory[],
  brands: GeneratedBrand[],
): { products: GeneratedProduct[]; variants: GeneratedVariant[] } {
  console.log("Generating products...");

  const products: GeneratedProduct[] = [];
  const variants: GeneratedVariant[] = [];
  const subcategories = categories.filter((c) => c.parentId !== null);

  const CONDITIONS: Array<"new" | "used" | "refurbished" | "aftermarket"> = ["new", "new", "new", "refurbished", "aftermarket"];
  const WARRANTIES = ["6 months", "12 months", "24 months", "36 months", null];
  const WEIGHT_UNITS = ["kg", "g", "kg", "kg"];

  for (let i = 0; i < CONFIG.products.total; i++) {
    const productId = createID("product");
    const category = randomElement(subcategories);
    const brand = randomElement(brands);
    const adjective = randomElement(PRODUCT_ADJECTIVES);
    const productName = `${adjective} ${faker.commerce.productName()}`;
    const partNum = `${faker.string.alpha({ length: 3, casing: "upper" })}-${faker.string.alphanumeric(3).toUpperCase()}-${String(i).padStart(3, "0")}`;

    const price = generatePrice();
    const condition = randomElement(CONDITIONS);
    const wholesalePrice = Math.round(price * 0.85);
    const costPrice = Math.round(price * 0.65);

    const product: GeneratedProduct = {
      id: productId,
      name: productName,
      slug: slugify(`${productName}-${faker.string.alphanumeric(4)}`),
      partNumber: partNum,
      oemNumber: Math.random() < 0.4 ? faker.string.alphanumeric(10).toUpperCase() : null,
      description:
        faker.commerce.productDescription() +
        "\n\n" +
        faker.lorem.paragraphs(2),
      shortDescription: faker.commerce.productDescription(),
      price,
      wholesalePrice,
      costPrice,
      condition,
      images: Array.from({ length: randomInt(2, 5) }, () =>
        generateProductImage(),
      ),
      categoryId: category.id,
      brandId: brand.id,
      sku: faker.string.alphanumeric(8).toUpperCase(),
      stock: randomInt(0, 500),
      unit: randomElement(PRODUCT_UNITS),
      weight: randomInt(100, 5000),
      weightUnit: randomElement(WEIGHT_UNITS),
      specifications: {
        material: faker.commerce.productMaterial(),
        ...(Math.random() < 0.5 ? { voltage: `${randomElement(["12V", "24V", "220V", "380V"])}` } : {}),
      },
      crossReferences: Math.random() < 0.3
        ? Array.from({ length: randomInt(1, 3) }, () => faker.string.alphanumeric(8).toUpperCase())
        : [],
      minOrderQuantity: randomElement([1, 1, 1, 5, 10]),
      warranty: randomElement(WARRANTIES),
      leadTimeDays: Math.random() < 0.3 ? randomInt(3, 30) : null,
      isActive: true,
    };

    products.push(product);

    if (Math.random() < CONFIG.products.withVariants) {
      const variantCount = randomInt(
        CONFIG.products.variantsPerProduct.min,
        CONFIG.products.variantsPerProduct.max,
      );
      const usesSizes = Math.random() < 0.5;
      const options = usesSizes ? VARIANT_SIZES : VARIANT_PACKS;

      for (let j = 0; j < Math.min(variantCount, options.length); j++) {
        const variantName = options[j]!;
        const variantPrice = usesSizes
          ? Math.round(price * (1 + j * 0.3))
          : Math.round(price * (1 - j * 0.05));

        variants.push({
          id: createID("product_variant"),
          productId,
          name: variantName,
          sku: `${product.sku}-${variantName.replace(/\s/g, "")}`,
          price: variantPrice,
          stock: randomInt(0, 200),
          attributes: usesSizes ? { size: variantName } : { pack: variantName },
          images: [generateProductImage()],
          isDefault: j === 0,
          sortOrder: j,
        });
      }
    }
  }

  return { products, variants };
}

function generateLocations(): GeneratedLocation[] {
  console.log("Generating locations...");

  return Array.from({ length: CONFIG.locations }, () => ({
    id: createID("location"),
    name: `1000 Hills ${faker.location.city()} Store`,
    address: faker.location.streetAddress({ useFullAddress: true }),
    landmark: `Near ${faker.company.name()}`,
    mobile: faker.phone.number(),
    email: faker.internet.email({ provider: "1000hills.rw" }),
    website: "https://1000hills.rw",
    isActive: true,
  }));
}

function generateStock(
  products: GeneratedProduct[],
  variants: GeneratedVariant[],
  locations: GeneratedLocation[],
): GeneratedStock[] {
  console.log("Generating stock records...");

  const stockRecords: GeneratedStock[] = [];
  const variantsByProduct = new Map<string, GeneratedVariant[]>();

  for (const variant of variants) {
    const existing = variantsByProduct.get(variant.productId) || [];
    existing.push(variant);
    variantsByProduct.set(variant.productId, existing);
  }

  for (const product of products) {
    const productVariants = variantsByProduct.get(product.id);

    for (const location of locations) {
      if (productVariants && productVariants.length > 0) {
        for (const variant of productVariants) {
          stockRecords.push({
            id: createID("product_stock"),
            productId: product.id,
            condition: "new",
            variantId: variant.id,
            locationId: location.id,
            quantity: randomInt(0, 100),
          });
        }
      } else {
        stockRecords.push({
          id: createID("product_stock"),
          productId: product.id,
          condition: "new",
          variantId: null,
          locationId: location.id,
          quantity: randomInt(0, 100),
        });
      }
    }
  }

  return stockRecords;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateULID().slice(-4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// ============================================================================
// CLI
// ============================================================================

function printHelp(): void {
  console.log(`
1000 Hills - Database Seed Script

Usage:
  bun run db:seed [options]

Options:
  --clean    Clear existing data before seeding
  -h, --help Show this help message

Environment variables:
  DATABASE_URL - PostgreSQL connection string (required)

Examples:
  bun run db:seed           # Seed the database (may fail if data exists)
  bun run db:seed:clean     # Clear and reseed the database
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  try {
    // Dynamic imports to prevent immediate database connection
    const { db } = await import("../drizzle");
    const { categoryTable } = await import("../category/category.sql");
    const { brandTable } = await import("../brand/brand.sql");
    const { productTable, productVariantTable } =
      await import("../product/product.sql");
    const { locationTable } = await import("../location/location.sql");
    const { productStockTable } = await import("../stock/stock.sql");
    const { cartTable, cartItemTable } = await import("../cart/cart.sql");
    const { orderTable, orderItemTable } = await import("../order/order.sql");
    const { userTable, accountTable, sessionTable } = await import(
      "../user/user.sql"
    );

    // Clear database if --clean flag is passed
    if (args.includes("--clean")) {
      console.log("Clearing existing data...");

      await db.delete(orderItemTable);
      await db.delete(orderTable);
      await db.delete(cartItemTable);
      await db.delete(cartTable);
      await db.delete(productStockTable);
      await db.delete(productVariantTable);
      await db.delete(productTable);
      await db.delete(categoryTable);
      await db.delete(brandTable);
      await db.delete(locationTable);
      await db.delete(sessionTable);
      await db.delete(accountTable);
      await db.delete(userTable);

      console.log("Database cleared.\n");
    }

    console.log("Starting database seed...\n");

    // Generate all data first
    const categories = generateCategories();
    const brands = generateBrands();
    const { products, variants } = generateProducts(categories, brands);
    const locations = generateLocations();
    const stockRecords = generateStock(products, variants, locations);

    console.log("\nInserting data into database...\n");

    // Insert categories (one by one to handle parent references)
    console.log(`Inserting ${categories.length} categories...`);
    for (const category of categories) {
      await db.insert(categoryTable).values(category);
    }

    // Insert brands
    console.log(`Inserting ${brands.length} brands...`);
    await db.insert(brandTable).values(brands);

    // Insert products
    console.log(`Inserting ${products.length} products...`);
    for (const product of products) {
      await db.insert(productTable).values(product);
    }

    // Insert variants
    console.log(`Inserting ${variants.length} product variants...`);
    if (variants.length > 0) {
      for (const variant of variants) {
        await db.insert(productVariantTable).values(variant);
      }
    }

    // Insert locations
    console.log(`Inserting ${locations.length} locations...`);
    await db.insert(locationTable).values(locations);

    // Insert stock records in batches
    console.log(`Inserting ${stockRecords.length} stock records...`);
    const stockBatchSize = 100;
    for (let i = 0; i < stockRecords.length; i += stockBatchSize) {
      const batch = stockRecords.slice(i, i + stockBatchSize);
      await db.insert(productStockTable).values(batch);
    }

    console.log("Creating demo users...");

    async function upsertUser({
      email,
      name,
      role,
      password,
    }: {
      email: string;
      name: string;
      role: "admin" | "user";
      password: string;
    }): Promise<string> {
      const [existing] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);

      const hashedPassword = await hashPassword(password);

      if (existing) {
        await db
          .update(userTable)
          .set({ name, role, emailVerified: true })
          .where(eq(userTable.id, existing.id));

        const [account] = await db
          .select()
          .from(accountTable)
          .where(eq(accountTable.userId, existing.id))
          .limit(1);

        if (account) {
          await db
            .update(accountTable)
            .set({ password: hashedPassword })
            .where(eq(accountTable.id, account.id));
        } else {
          await db.insert(accountTable).values({
            id: createID("account"),
            userId: existing.id,
            accountId: existing.id,
            providerId: "credential",
            password: hashedPassword,
          });
        }

        return existing.id;
      }

      const userId = createID("user");
      await db.insert(userTable).values({
        id: userId,
        email,
        name,
        role,
        emailVerified: true,
      });
      await db.insert(accountTable).values({
        id: createID("account"),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
      });

      return userId;
    }

    await upsertUser({
      email: CONFIG.demoUsers.admin.email,
      name: CONFIG.demoUsers.admin.name,
      role: "admin",
      password: CONFIG.demoUsers.admin.password,
    });

    const shopperUserId = await upsertUser({
      email: CONFIG.demoUsers.shopper.email,
      name: CONFIG.demoUsers.shopper.name,
      role: "user",
      password: CONFIG.demoUsers.shopper.password,
    });

    console.log("Creating demo cart...");
    const cartId = createID("cart");
    await db.insert(cartTable).values({
      id: cartId,
      userId: shopperUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const variantsByProduct = new Map<string, GeneratedVariant[]>();
    for (const variant of variants) {
      const list = variantsByProduct.get(variant.productId) || [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }

    const cartProducts = products.slice(5, 9);
    for (let index = 0; index < cartProducts.length; index++) {
      const product = cartProducts[index]!;
      const productVariants = variantsByProduct.get(product.id) || [];
      const variant = productVariants[0];
      const deliveryMethod = index === 0 ? "pickup" : "delivery";
      const pickupLocationId =
        deliveryMethod === "pickup" ? locations[0]?.id : undefined;

      await db.insert(cartItemTable).values({
        id: createID("cart_item"),
        cartId,
        productId: product.id,
        productVariantId: variant?.id,
        quantity: randomInt(1, 3),
        deliveryMethod,
        pickupLocationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log("Creating demo orders...");
    const orderProducts = products.slice(10, 14);
    for (let i = 0; i < 2; i++) {
      const orderId = createID("order");
      const orderNumber = generateOrderNumber();
      const orderItems = orderProducts.slice(i * 2, i * 2 + 2);

      const subtotal = orderItems.reduce((sum, product) => sum + product.price, 0);
      const shippingAmount = 500;
      const total = subtotal + shippingAmount;

      await db.insert(orderTable).values({
        id: orderId,
        orderNumber,
        userId: shopperUserId,
        email: CONFIG.demoUsers.shopper.email,
        status: i === 0 ? "processing" : "delivered",
        paymentStatus: i === 0 ? "pending" : "paid",
        paymentMethod: "cod",
        subtotal,
        shippingAmount,
        discountAmount: 0,
        taxAmount: 0,
        total,
        currency: "USD",
        shippingAddress: {
          firstName: "Demo",
          lastName: "Shopper",
          street1: "123 Market Street",
          city: "Springfield",
          state: "CA",
          postalCode: "94110",
          country: "USA",
          phone: "+1 (555) 123-4567",
        },
        billingAddress: {
          firstName: "Demo",
          lastName: "Shopper",
          street1: "123 Market Street",
          city: "Springfield",
          state: "CA",
          postalCode: "94110",
          country: "USA",
          phone: "+1 (555) 123-4567",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      for (const product of orderItems) {
        await db.insert(orderItemTable).values({
          id: createID("order_item"),
          orderId,
          productId: product.id,
          productVariantId: null,
          name: product.name,
          sku: product.sku,
          image: product.images[0] || null,
          price: product.price,
          quantity: 1,
          total: product.price,
          deliveryMethod: "delivery",
          createdAt: new Date(),
        });
      }
    }

    console.log("\n========================================");
    console.log("Seed completed successfully!");
    console.log("========================================\n");
    console.log("Summary:");
    console.log(`  - Categories: ${categories.length}`);
    console.log(`  - Brands: ${brands.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Product Variants: ${variants.length}`);
    console.log(`  - Locations: ${locations.length}`);
    console.log(`  - Stock Records: ${stockRecords.length}`);
    console.log(`  - Demo Users: 2`);
    console.log(`    - Admin: ${CONFIG.demoUsers.admin.email}`);
    console.log(`    - Shopper: ${CONFIG.demoUsers.shopper.email}`);
    console.log("");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
