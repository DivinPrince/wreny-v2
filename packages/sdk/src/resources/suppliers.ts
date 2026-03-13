import { z } from "zod";
import { SupplierService } from "@repo/core/supplier";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

export type Supplier = z.infer<typeof SupplierService.Info>;
export type CreateSupplierInput = z.infer<typeof SupplierService.CreateInput>;
export type UpdateSupplierInput = z.infer<typeof SupplierService.UpdateInput>;

export class SuppliersResource extends APIResource {
  list(
    params?: { isActive?: string },
    options?: RequestOptions,
  ): Promise<Response<Supplier[]>> {
    return this._client.get("/api/suppliers", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  get(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<Supplier>> {
    return this._client.get(`/api/suppliers/${id}`, options);
  }

  getBySlug(
    slug: string,
    options?: RequestOptions,
  ): Promise<Response<Supplier>> {
    return this._client.get(`/api/suppliers/slug/${slug}`, options);
  }

  create(
    data: CreateSupplierInput,
    options?: RequestOptions,
  ): Promise<Response<Supplier>> {
    return this._client.post("/api/suppliers", {
      ...options,
      body: data,
    });
  }

  update(
    id: string,
    data: Omit<UpdateSupplierInput, "id">,
    options?: RequestOptions,
  ): Promise<Response<Supplier>> {
    return this._client.put(`/api/suppliers/${id}`, {
      ...options,
      body: data,
    });
  }

  delete(id: string, options?: RequestOptions): Promise<{ success: boolean }> {
    return this._client.delete(`/api/suppliers/${id}`, options);
  }
}
