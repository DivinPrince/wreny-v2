import { z } from "zod";
import { BrandService } from "@repo/core/brand";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

// Infer types from core
export type Brand = z.infer<typeof BrandService.Info>;

// Infer input types from core schemas
export type CreateBrandInput = z.infer<typeof BrandService.CreateInput>;
export type UpdateBrandInput = z.infer<typeof BrandService.UpdateInput>;

// Query parameters for list endpoint
export interface BrandListParams {
  /**
   * Filter by active status
   * - 'true': Only active brands
   * - 'false': Only inactive brands
   * - undefined: All brands
   */
  isActive?: "true" | "false";
}

/**
 * Brands API resource
 */
export class BrandsResource extends APIResource {
  /**
   * List all brands.
   *
   * @param params - Optional filter parameters
   * @example
   * ```typescript
   * const brands = await client.brands.list();
   * const activeBrands = await client.brands.list({ isActive: 'true' });
   * ```
   */
  list(
    params?: BrandListParams,
    options?: RequestOptions,
  ): Promise<Response<Brand[]>> {
    return this._client.get("/api/brands", {
      ...options,
      query: params as Record<string, string | undefined> | undefined,
    });
  }

  /**
   * Get a brand by ID.
   *
   * @param id - Brand ID
   */
  get(id: string, options?: RequestOptions): Promise<Response<Brand>> {
    return this._client.get(`/api/brands/${id}`, options);
  }

  /**
   * Get a brand by slug.
   *
   * @param slug - Brand slug
   */
  getBySlug(slug: string, options?: RequestOptions): Promise<Response<Brand>> {
    return this._client.get(`/api/brands/slug/${slug}`, options);
  }

  /**
   * Create a new brand. Requires admin access.
   *
   * @param data - Brand data
   */
  create(
    data: CreateBrandInput,
    options?: RequestOptions,
  ): Promise<Response<Brand>> {
    return this._client.post("/api/brands", {
      ...options,
      body: data,
    });
  }

  /**
   * Update an existing brand. Requires admin access.
   *
   * @param id - Brand ID
   * @param data - Updated brand data
   */
  update(
    id: string,
    data: UpdateBrandInput,
    options?: RequestOptions,
  ): Promise<Response<Brand>> {
    return this._client.put(`/api/brands/${id}`, {
      ...options,
      body: data,
    });
  }

  /**
   * Soft delete a brand. Requires admin access.
   *
   * @param id - Brand ID
   */
  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/brands/${id}`, options);
  }
}
