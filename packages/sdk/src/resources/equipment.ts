import { z } from "zod";
import { EquipmentService } from "@repo/core/equipment";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

export type Equipment = z.infer<typeof EquipmentService.Info>;
export type CreateEquipmentInput = z.infer<typeof EquipmentService.CreateInput>;
export type UpdateEquipmentInput = z.infer<typeof EquipmentService.UpdateInput>;
export type ProductCompatibility = z.infer<
  typeof EquipmentService.CompatibilityInfo
>;

export type EquipmentListParams = {
  type?: "vehicle" | "generator" | "machinery" | "electronics" | "other";
  make?: string;
  isActive?: string;
};

export type AddCompatibilityInput = {
  productId: string;
  equipmentId: string;
  notes?: string;
};

export type EquipmentProductLink = {
  compatibility: ProductCompatibility;
  product: {
    id: string;
    name: string;
    partNumber: string;
    slug: string;
  };
};

export class EquipmentResource extends APIResource {
  list(
    params?: EquipmentListParams,
    options?: RequestOptions,
  ): Promise<Response<Equipment[]>> {
    return this._client.get("/api/equipment", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  getMakes(options?: RequestOptions): Promise<Response<string[]>> {
    return this._client.get("/api/equipment/makes", options);
  }

  get(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<Equipment>> {
    return this._client.get(`/api/equipment/${id}`, options);
  }

  getProducts(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<EquipmentProductLink[]>> {
    return this._client.get(`/api/equipment/${id}/products`, options);
  }

  create(
    data: CreateEquipmentInput,
    options?: RequestOptions,
  ): Promise<Response<Equipment>> {
    return this._client.post("/api/equipment", {
      ...options,
      body: data,
    });
  }

  update(
    id: string,
    data: Omit<UpdateEquipmentInput, "id">,
    options?: RequestOptions,
  ): Promise<Response<Equipment>> {
    return this._client.put(`/api/equipment/${id}`, {
      ...options,
      body: data,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/equipment/${id}`, options);
  }

  addCompatibility(
    data: AddCompatibilityInput,
    options?: RequestOptions,
  ): Promise<Response<ProductCompatibility>> {
    return this._client.post("/api/equipment/compatibility", {
      ...options,
      body: data,
    });
  }

  removeCompatibility(
    id: string,
    options?: RequestOptions,
  ): Promise<{ success: boolean }> {
    return this._client.delete(`/api/equipment/compatibility/${id}`, options);
  }
}
