import { EquipmentService } from "@repo/core/equipment";
import { z } from "zod";
import { ProductService } from "@repo/core/product";
import { APIResource } from "../core";
import type { Response, PaginatedResponse, RequestOptions } from "../types";

export type Product = z.infer<typeof ProductService.Info>;
export type ProductWithDetails = z.infer<
  typeof ProductService.ProductWithDetails
>;
export type ProductVariant = z.infer<typeof ProductService.VariantInfo>;
export type FilterOptions = z.infer<typeof ProductService.FilterOptions>;
export type ProductEquipmentLink = {
  compatibility: z.infer<typeof EquipmentService.CompatibilityInfo>;
  equipment: z.infer<typeof EquipmentService.Info>;
};

export type ProductListParams = z.infer<typeof ProductService.ListQueryInput>;
export type CreateProductInput = z.infer<typeof ProductService.CreateInput>;
export type UpdateProductInput = z.infer<typeof ProductService.UpdateInput>;

export type CreateVariantInput = {
  name: string;
  partNumber?: string;
  sku?: string;
  price?: number;
  stock?: number;
  condition?: "new" | "used" | "refurbished" | "aftermarket";
  attributes?: Record<string, string>;
  images?: string[];
  isDefault?: boolean;
  sortOrder?: number;
};

export class ProductsResource extends APIResource {
  getFilters(params?: { categoryId?: string }, options?: RequestOptions): Promise<Response<FilterOptions>> {
    return this._client.get("/api/products/filters", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  list(
    params?: ProductListParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<ProductWithDetails>> {
    return this._client.get("/api/products", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  get(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<ProductWithDetails>> {
    return this._client.get(`/api/products/${id}`, options);
  }

  getBySlug(
    slug: string,
    options?: RequestOptions,
  ): Promise<Response<ProductWithDetails>> {
    return this._client.get(`/api/products/slug/${slug}`, options);
  }

  getByPartNumber(
    partNumber: string,
    options?: RequestOptions,
  ): Promise<Response<Product>> {
    return this._client.get(`/api/products/part/${encodeURIComponent(partNumber)}`, options);
  }

  getVariants(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<ProductVariant[]>> {
    return this._client.get(`/api/products/${id}/variants`, options);
  }

  getEquipment(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<ProductEquipmentLink[]>> {
    return this._client.get(`/api/products/${id}/equipment`, options);
  }

  create(
    data: CreateProductInput,
    options?: RequestOptions,
  ): Promise<Response<Product>> {
    return this._client.post("/api/products", {
      ...options,
      body: data,
    });
  }

  update(
    id: string,
    data: UpdateProductInput,
    options?: RequestOptions,
  ): Promise<Response<Product>> {
    return this._client.put(`/api/products/${id}`, {
      ...options,
      body: data,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/products/${id}`, options);
  }

  createVariant(
    id: string,
    data: CreateVariantInput,
    options?: RequestOptions,
  ): Promise<Response<ProductVariant>> {
    return this._client.post(`/api/products/${id}/variants`, {
      ...options,
      body: data,
    });
  }
}
