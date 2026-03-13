import { z } from "zod";
import { LocationService } from "@repo/core/location";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

// Infer types from core package schemas
export type Location = z.infer<typeof LocationService.Info>;

// Infer input types from core schemas
export type CreateLocationInput = z.infer<typeof LocationService.CreateInput>;
export type UpdateLocationInput = z.infer<typeof LocationService.UpdateInput>;

// Input types
export type LocationListParams = Partial<{
  isActive: "true" | "false";
}>;

/**
 * Locations API resource
 */
export class LocationsResource extends APIResource {
  /**
   * List locations with optional filters.
   * Returns all store locations, optionally filtered by active status.
   *
   * @param params - Query parameters for filtering
   * @example
   * ```typescript
   * const locations = await client.locations.list();
   *
   * // Filter for active locations only
   * const activeLocations = await client.locations.list({
   *   isActive: 'true'
   * });
   * ```
   */
  list(
    params?: LocationListParams,
    options?: RequestOptions,
  ): Promise<Response<Location[]>> {
    return this._client.get("/api/locations", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  /**
   * Get a location by ID.
   *
   * @param id - Location ID
   * @example
   * ```typescript
   * const location = await client.locations.get('location_123');
   * console.log(location.data.name);
   * console.log(location.data.address);
   * ```
   */
  get(id: string, options?: RequestOptions): Promise<Response<Location>> {
    return this._client.get(`/api/locations/${id}`, options);
  }

  /**
   * Get stock at a specific location.
   * Returns all product stock available at the given location.
   *
   * @param id - Location ID
   * @example
   * ```typescript
   * const stock = await client.locations.getStock('location_123');
   * console.log(stock.data); // Array of stock items
   * ```
   */
  getStock(id: string, options?: RequestOptions): Promise<Response<unknown[]>> {
    return this._client.get(`/api/locations/${id}/stock`, options);
  }

  /**
   * Create a new location. Requires admin access.
   *
   * @param data - Location data
   * @example
   * ```typescript
   * const location = await client.locations.create({
   *   name: 'Downtown Store',
   *   address: '123 Main St',
   *   mobile: '+1-555-0100',
   *   isActive: true
   * });
   * ```
   */
  create(
    data: CreateLocationInput,
    options?: RequestOptions,
  ): Promise<Response<Location>> {
    return this._client.post("/api/locations", {
      ...options,
      body: data,
    });
  }

  /**
   * Update an existing location. Requires admin access.
   *
   * @param id - Location ID
   * @param data - Updated location data
   * @example
   * ```typescript
   * const location = await client.locations.update('location_123', {
   *   mobile: '+1-555-0199',
   *   email: 'downtown@1000hills.rw',
   *   isActive: true
   * });
   * ```
   */
  update(
    id: string,
    data: UpdateLocationInput,
    options?: RequestOptions,
  ): Promise<Response<Location>> {
    return this._client.put(`/api/locations/${id}`, {
      ...options,
      body: data,
    });
  }

  /**
   * Delete a location. Requires admin access.
   *
   * @param id - Location ID
   * @example
   * ```typescript
   * await client.locations.delete('location_123');
   * ```
   */
  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/locations/${id}`, options);
  }
}
