# @repo/sdk

Type-safe TypeScript SDK for the 1000hills e-commerce API.

## Features

- **Full Type Safety** - Built with TypeScript and infers types directly from the core schemas
- **Automatic Retry** - Configurable retry logic with exponential backoff
- **Multiple Auth Methods** - Support for both token-based and cookie-based authentication
- **Error Handling** - Typed error classes for different error scenarios
- **Response Helpers** - Convenient methods to access both data and response objects

## Installation

```bash
# In a workspace package
bun add @repo/sdk

# Or add to package.json
{
  "dependencies": {
    "@repo/sdk": "workspace:*"
  }
}
```

## Quick Start

### Token-Based Authentication (Admin App)

```typescript
import { Sdk } from "@repo/sdk";

const client = new Sdk({
  baseURL: process.env.API_URL,
  token: process.env.API_TOKEN,
});

// List all products
const products = await client.products.list({ limit: "20" });
console.log(products.data);

// Create a product (admin only)
const newProduct = await client.products.create({
  name: "New Product",
  slug: "new-product",
  description: "A great product",
  price: 29.99,
  stock: 100,
});
```

### Cookie-Based Authentication (Web App)

```typescript
import { Sdk } from "@repo/sdk";

const client = new Sdk({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include", // Send cookies with requests
});

// Get current user's cart
const cart = await client.cart.get();

// Add item to cart
await client.cart.addItem({
  productId: "product_123",
  quantity: 2,
});
```

## Configuration Options

```typescript
const client = new Sdk({
  baseURL: "https://api.example.com",
  token: "your-auth-token", // Optional: Bearer token
  credentials: "include", // Optional: 'include' | 'omit' | 'same-origin'
  timeout: 30000, // Optional: Request timeout in ms (default: 30000)
  maxRetries: 3, // Optional: Max retry attempts (default: 3)
});
```

## API Resources

### Products

```typescript
// List products with filters
const products = await client.products.list({
  categoryId: "cat_123",
  limit: "20",
  offset: "0",
});

// Get product by ID
const product = await client.products.get("product_123");

// Get product by slug
const product = await client.products.getBySlug("product-slug");

// Get product variants
const variants = await client.products.getVariants("product_123");

// Get available filters for products
const filters = await client.products.getFilters();

// Admin: Create product
const newProduct = await client.products.create({
  name: "Product Name",
  slug: "product-slug",
  price: 29.99,
  categoryId: "cat_123",
});

// Admin: Update product
await client.products.update("product_123", {
  price: 24.99,
});

// Admin: Delete product
await client.products.delete("product_123");
```

### Categories

```typescript
// List all categories (returns tree structure)
const categories = await client.categories.list();

// Get category by ID
const category = await client.categories.get("cat_123");

// Get category by slug
const category = await client.categories.getBySlug("electronics");

// Admin: Create category
await client.categories.create({
  name: "Electronics",
  slug: "electronics",
  parentId: "cat_root",
});

// Admin: Update category
await client.categories.update("cat_123", { name: "Consumer Electronics" });

// Admin: Delete category
await client.categories.delete("cat_123");
```

### Brands

```typescript
// List all brands
const brands = await client.brands.list();

// Get brand by ID
const brand = await client.brands.get("brand_123");

// Get brand by slug
const brand = await client.brands.getBySlug("apple");

// Admin: Create, update, delete brands
await client.brands.create({ name: "Apple", slug: "apple" });
await client.brands.update("brand_123", { name: "Apple Inc." });
await client.brands.delete("brand_123");
```

### Cart

```typescript
// Get current user's cart
const cart = await client.cart.get();

// Add item to cart
await client.cart.addItem({
  productId: "product_123",
  variantId: "variant_456", // Optional
  quantity: 2,
});

// Update cart item quantity
await client.cart.updateItem("item_123", { quantity: 5 });

// Remove item from cart
await client.cart.removeItem("item_123");

// Clear entire cart
await client.cart.clear();
```

### Orders

```typescript
// List user's orders
const orders = await client.orders.list({
  status: "pending",
  limit: "10",
});

// Get order by ID
const order = await client.orders.get("order_123");

// Create new order
const newOrder = await client.orders.create({
  addressId: "addr_123",
  paymentMethod: "card",
});

// Cancel order
await client.orders.cancel("order_123");
```

### Users

```typescript
// Get current user profile
const user = await client.users.me();

// Update profile
await client.users.updateProfile({
  name: "John Doe",
  phone: "+1234567890",
});

// List user addresses
const addresses = await client.users.listAddresses();

// Get specific address
const address = await client.users.getAddress("addr_123");

// Create new address
await client.users.createAddress({
  firstName: "John",
  lastName: "Doe",
  addressLine1: "123 Main St",
  city: "New York",
  country: "US",
  postalCode: "10001",
});

// Update address
await client.users.updateAddress("addr_123", {
  addressLine1: "456 Oak Ave",
});

// Set default address
await client.users.setDefaultAddress("addr_123");

// Delete address
await client.users.deleteAddress("addr_123");
```

### Locations (Store Locations)

```typescript
// List all locations
const locations = await client.locations.list();

// Get location by ID
const location = await client.locations.get("loc_123");

// Get stock at location
const stock = await client.locations.getStock("loc_123", {
  productId: "product_123",
});

// Admin: Create, update, delete locations
await client.locations.create({
  name: "Downtown Store",
  address: "123 Main St",
});
```

### Stock Management

```typescript
// Get stock for a product across all locations
const stock = await client.stock.getByProduct("product_123");

// Get stock for a variant
const variantStock = await client.stock.getByVariant("variant_456");

// Get all stock at a location
const locationStock = await client.stock.getByLocation("loc_123");

// Get total stock across all locations
const total = await client.stock.getTotalStock("product_123", "variant_456");

// Check if product is available
const available = await client.stock.checkAvailability(
  "product_123",
  "variant_456",
  10,
);

// Get locations with stock
const locationsWithStock = await client.stock.getLocationsWithStock(
  "product_123",
  "variant_456",
);
```

### Upload (File Management)

```typescript
// Upload a file (browser context)
const file = event.target.files[0];
const result = await client.upload.put(file, {
  folder: "products",
});
console.log(result.data.url); // Vercel Blob public URL

// Upload with custom options
const result = await client.upload.put(file, {
  folder: "marketing/banners",
});

// Delete uploaded file
await client.upload.delete(result.data.url);
```

**Supported Options:**

- `folder` - Path prefix in Blob storage (e.g., 'products', 'marketing/banners')

**File Constraints:**

- Max size: 10MB
- Allowed types: image/jpeg, image/png, image/webp, image/gif, image/svg+xml

**Response:**

```typescript
{
  url: string; // Public URL of uploaded file
  filename: string; // Generated filename
  contentType: string;
  size: number; // File size in bytes
}
```

## Response Helpers

The SDK provides two ways to access response data:

```typescript
// Get data directly (default)
const products = await client.products.list();
console.log(products.data); // Array of products

// Get full response with .asResponse()
const response = await client.products.list().asResponse();
console.log(response.status); // 200
console.log(response.headers); // Headers object
console.log(response.data); // Array of products

// Get both data and response with .withResponse()
const { data, response } = await client.products.list().withResponse();
console.log(data); // Array of products
console.log(response.status); // 200
```

## Error Handling

```typescript
import {
  APIError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from "@repo/sdk";

try {
  const product = await client.products.get("invalid_id");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error("Product not found:", error.message);
  } else if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof ValidationError) {
    console.error("Validation error:", error.message);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
  } else if (error instanceof ServerError) {
    console.error("Server error:", error.message);
  } else if (error instanceof APIError) {
    console.error("API error:", error.status, error.message);
  }
}
```

## Type Safety

All types are automatically inferred from the core package schemas:

```typescript
import type {
  Product,
  Category,
  Brand,
  Cart,
  Order,
  User,
  Address,
} from "@repo/sdk";

// TypeScript will autocomplete and type-check all properties
const product: Product = await client.products.get("product_123");
console.log(product.name); // ✅ Type-safe
console.log(product.invalidProp); // ❌ TypeScript error
```

## Development

```bash
# Install dependencies
bun install

# Build the SDK
bun run build

# Type check
bun tsc --noEmit
```

## License

Private - Internal use only
