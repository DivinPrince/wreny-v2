import { APIClient } from "./core";
import { ProductsResource } from "./resources/products";
import { CategoriesResource } from "./resources/categories";
import { BrandsResource } from "./resources/brands";
import { SuppliersResource } from "./resources/suppliers";
import { EquipmentResource } from "./resources/equipment";
import { CartResource } from "./resources/cart";
import { OrdersResource } from "./resources/orders";
import { UsersResource } from "./resources/users";
import { LocationsResource } from "./resources/locations";
import { StockResource } from "./resources/stock";
import { UploadResource } from "./resources/upload";
import { CheckoutResource } from "./resources/checkout";

export * from "./error";
export * from "./types";
export * from "./resources/products";
export * from "./resources/categories";
export * from "./resources/brands";
export * from "./resources/suppliers";
export * from "./resources/equipment";
export * from "./resources/cart";
export * from "./resources/orders";
export * from "./resources/users";
export * from "./resources/locations";
export * from "./resources/stock";
export * from "./resources/upload";
export * from "./resources/checkout";

export interface SdkOptions {
  baseURL?: string;
  token?: string;
  credentials?: RequestCredentials;
  timeout?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export class Sdk extends APIClient {
  products: ProductsResource;
  categories: CategoriesResource;
  brands: BrandsResource;
  suppliers: SuppliersResource;
  equipment: EquipmentResource;
  cart: CartResource;
  orders: OrdersResource;
  users: UsersResource;
  locations: LocationsResource;
  stock: StockResource;
  upload: UploadResource;
  checkout: CheckoutResource;

  constructor(options: SdkOptions = {}) {
    const {
      baseURL = "http://localhost:3000",
      token,
      credentials,
      timeout,
      maxRetries,
      fetch: customFetch,
      headers,
    } = options;

    super({
      baseURL,
      token,
      credentials,
      timeout,
      maxRetries,
      fetch: customFetch,
      headers,
    });

    this.products = new ProductsResource(this);
    this.categories = new CategoriesResource(this);
    this.brands = new BrandsResource(this);
    this.suppliers = new SuppliersResource(this);
    this.equipment = new EquipmentResource(this);
    this.cart = new CartResource(this);
    this.orders = new OrdersResource(this);
    this.users = new UsersResource(this);
    this.locations = new LocationsResource(this);
    this.stock = new StockResource(this);
    this.upload = new UploadResource(this);
    this.checkout = new CheckoutResource(this);
  }
}

export default Sdk;
