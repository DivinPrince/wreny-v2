import { z } from "zod";
import { CategoryService } from "@repo/core/category";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

// Infer types from core
export type Category = z.infer<typeof CategoryService.Info>;
export type CategoryTreeNode = CategoryService.CategoryTreeNode;

// Infer input types from core schemas
export type CreateCategoryInput = z.infer<typeof CategoryService.CreateInput>;
export type UpdateCategoryInput = z.infer<typeof CategoryService.UpdateInput>;

// Query parameters for list endpoints
export interface CategoryListParams {
  /**
   * Filter by active status
   * - 'true': Only active categories
   * - 'false': Only inactive categories
   * - undefined: All categories
   */
  isActive?: "true" | "false";

  /**
   * Filter by parent ID
   * - Category ID: Only categories with this parent
   * - 'null': Only root categories
   * - undefined: All categories
   */
  parentId?: string | "null";
}

const toCategoryQuery = (
  params?: CategoryListParams,
): Record<string, string | undefined> | undefined => {
  if (!params) {
    return undefined;
  }

  return {
    isActive: params.isActive,
    parentId: params.parentId,
  };
};

/**
 * Categories API resource
 */
export class CategoriesResource extends APIResource {
  /**
   * List all categories (flat list).
   *
   * @param params - Optional filter parameters
   * @example
   * ```typescript
   * const categories = await client.categories.list();
   * const activeCategories = await client.categories.list({ isActive: 'true' });
   * ```
   */
  list(
    params?: CategoryListParams,
    options?: RequestOptions,
  ): Promise<Response<Category[]>> {
    return this._client.get("/api/categories", {
      ...options,
      query: toCategoryQuery(params),
    });
  }

  /**
   * Get all categories as a hierarchical tree structure.
   *
   * @param params - Optional filter parameters
   * @example
   * ```typescript
   * const tree = await client.categories.tree();
   * const activeTree = await client.categories.tree({ isActive: 'true' });
   * ```
   */
  tree(
    params?: CategoryListParams,
    options?: RequestOptions,
  ): Promise<Response<CategoryTreeNode[]>> {
    return this._client.get("/api/categories/tree", {
      ...options,
      query: toCategoryQuery(params),
    });
  }

  /**
   * Get a category by ID with its children and parent.
   *
   * @param id - Category ID
   */
  get(id: string, options?: RequestOptions): Promise<Response<Category>> {
    return this._client.get(`/api/categories/${id}`, options);
  }

  /**
   * Get a category by slug with its children and parent.
   *
   * @param slug - Category slug
   */
  getBySlug(
    slug: string,
    options?: RequestOptions,
  ): Promise<Response<Category>> {
    return this._client.get(`/api/categories/slug/${slug}`, options);
  }

  /**
   * Create a new category. Requires admin access.
   *
   * @param data - Category data
   */
  create(
    data: CreateCategoryInput,
    options?: RequestOptions,
  ): Promise<Response<Category>> {
    return this._client.post("/api/categories", {
      ...options,
      body: data,
    });
  }

  /**
   * Update an existing category. Requires admin access.
   *
   * @param id - Category ID
   * @param data - Updated category data
   */
  update(
    id: string,
    data: UpdateCategoryInput,
    options?: RequestOptions,
  ): Promise<Response<Category>> {
    return this._client.put(`/api/categories/${id}`, {
      ...options,
      body: data,
    });
  }

  /**
   * Soft delete a category. Requires admin access.
   *
   * @param id - Category ID
   */
  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/categories/${id}`, options);
  }
}
