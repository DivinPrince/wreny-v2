import { auth } from "@repo/core/auth";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { brandsApi } from "./brands";
import { cartApi } from "./cart";
import { checkoutApi } from "./checkout";
import { categoriesApi } from "./categories";
import { handleError, type AppEnv, sessionMiddleware } from "./common";
import { equipmentApi } from "./equipment";
import { locationsApi } from "./locations";
import { ordersApi } from "./orders";
import { productsApi } from "./products";
import { stockApi } from "./stock";
import { suppliersApi } from "./suppliers";
import { uploadApi } from "./upload";
import { usersApi } from "./users";

const apiRoutes = new Hono<AppEnv>()
  .get("/", (c) =>
    c.json({
      name: "@repo/functions",
      status: "ok",
      routes: [
        "/api/auth/*",
        "/api/products",
        "/api/categories",
        "/api/brands",
        "/api/suppliers",
        "/api/equipment",
        "/api/cart",
        "/api/orders",
        "/api/users",
        "/api/locations",
        "/api/stock",
        "/api/checkout",
        "/api/cms/upload",
      ],
    }),
  )
  .get("/doc", (c) =>
    c.json({
      name: "@repo/functions",
      version: "0.0.1",
      note: "Route inventory endpoint. Full OpenAPI generation can be added once the API surface stabilizes.",
      groups: {
        auth: "/api/auth/*",
        categories: "/api/categories",
        products: "/api/products",
        brands: "/api/brands",
        suppliers: "/api/suppliers",
        equipment: "/api/equipment",
        cart: "/api/cart",
        orders: "/api/orders",
        users: "/api/users",
        locations: "/api/locations",
        stock: "/api/stock",
        checkout: "/api/checkout",
        upload: "/api/cms/upload",
      },
    }),
  )
  .route("/categories", categoriesApi)
  .route("/products", productsApi)
  .route("/brands", brandsApi)
  .route("/suppliers", suppliersApi)
  .route("/equipment", equipmentApi)
  .route("/cart", cartApi)
  .route("/orders", ordersApi)
  .route("/users", usersApi)
  .route("/locations", locationsApi)
  .route("/stock", stockApi)
  .route("/checkout", checkoutApi)
  .route("/cms", uploadApi);

export const app = new Hono<AppEnv>();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.ADMIN_URL || "http://localhost:3001",
];

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);
app.use("/api/*", sessionMiddleware);

app.get("/", (c) =>
  c.json({ name: "thousand-hills", status: "ok", docs: "/api" }),
);
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api", apiRoutes);
app.onError(handleError);

export { apiRoutes };
