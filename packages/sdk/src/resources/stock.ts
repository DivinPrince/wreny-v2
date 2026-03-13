import { z } from "zod";
import { StockService } from "@repo/core/stock";
import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";

export type Stock = z.infer<typeof StockService.Info>;
export type StockWithLocation = z.infer<typeof StockService.StockWithLocation>;
export type StockWithProductAndLocation = z.infer<
  typeof StockService.StockWithProductAndLocation
>;
export type LocationWithStock = z.infer<typeof StockService.LocationWithStock>;
export type StockMovement = z.infer<typeof StockService.MovementInfo>;
export type ReorderAlert = z.infer<typeof StockService.ReorderAlert>;

export type StockCheckInput = {
  productId: string;
  locationId: string;
  quantity: number;
  variantId?: string;
};

export type StockCheckResult = {
  available: boolean;
  currentStock: number;
  requestedQuantity: number;
};

export type GetStockByLocationParams = {
  productId: string;
  locationId: string;
  variantId?: string;
};

export type GetTotalStockParams = {
  productId: string;
  variantId?: string;
};

export type GetLocationsWithStockParams = {
  productId: string;
  variantId?: string;
  minQuantity?: number;
};

export type GetMovementsParams = {
  productId?: string;
  locationId?: string;
  type?: "in" | "out" | "adjustment" | "transfer" | "return";
  limit?: number;
  offset?: number;
};

export type UpsertStockInput = {
  productId: string;
  locationId: string;
  quantity: number;
  variantId?: string;
  condition?: "new" | "used" | "refurbished";
  costPrice?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  supplierId?: string;
  batchNumber?: string;
};

export type UpsertStockResult = {
  stock: Stock;
  created: boolean;
};

export type RecordMovementInput = {
  productStockId: string;
  productId: string;
  locationId: string;
  type: "in" | "out" | "adjustment" | "transfer" | "return";
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
};

export type ReceiveInput = {
  productStockId: string;
  productId: string;
  locationId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
};

export type IssueInput = {
  productStockId: string;
  productId: string;
  locationId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
};

export type SetCountedBalanceInput = {
  productStockId: string;
  productId: string;
  locationId: string;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
};

export type TransferInput = {
  sourceProductStockId: string;
  sourceProductId: string;
  sourceLocationId: string;
  destProductStockId: string;
  destProductId: string;
  destLocationId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
};

export class StockResource extends APIResource {
  getByProduct(
    productId: string,
    options?: RequestOptions,
  ): Promise<Response<StockWithLocation[]>> {
    return this._client.get(`/api/stock/product/${productId}`, options);
  }

  getByVariant(
    productId: string,
    variantId: string,
    options?: RequestOptions,
  ): Promise<Response<StockWithLocation[]>> {
    return this._client.get(
      `/api/stock/product/${productId}/variant/${variantId}`,
      options,
    );
  }

  getByLocation(
    params: GetStockByLocationParams,
    options?: RequestOptions,
  ): Promise<Response<Stock | null>> {
    const { productId, locationId, variantId } = params;
    return this._client.get(
      `/api/stock/product/${productId}/location/${locationId}`,
      {
        ...options,
        query: variantId ? { variantId } : undefined,
      },
    );
  }

  getTotalStock(
    params: GetTotalStockParams,
    options?: RequestOptions,
  ): Promise<Response<{ total: number }>> {
    const { productId, variantId } = params;
    return this._client.get(`/api/stock/product/${productId}/total`, {
      ...options,
      query: variantId ? { variantId } : undefined,
    });
  }

  checkAvailability(
    data: StockCheckInput,
    options?: RequestOptions,
  ): Promise<Response<StockCheckResult>> {
    return this._client.post("/api/stock/check", {
      ...options,
      body: data,
    });
  }

  getLocationsWithStock(
    params: GetLocationsWithStockParams,
    options?: RequestOptions,
  ): Promise<Response<LocationWithStock[]>> {
    const { productId, variantId, minQuantity } = params;
    const query: Record<string, string | undefined> = {};
    if (variantId) query.variantId = variantId;
    if (minQuantity !== undefined) query.minQuantity = minQuantity.toString();

    return this._client.get(`/api/stock/product/${productId}/locations`, {
      ...options,
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  }

  getMovements(
    params?: GetMovementsParams,
    options?: RequestOptions,
  ): Promise<Response<StockMovement[]>> {
    const query: Record<string, string | undefined> = {};
    if (params?.productId) query.productId = params.productId;
    if (params?.locationId) query.locationId = params.locationId;
    if (params?.type) query.type = params.type;
    if (params?.limit !== undefined) query.limit = params.limit.toString();
    if (params?.offset !== undefined) query.offset = params.offset.toString();

    return this._client.get("/api/stock/movements", {
      ...options,
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  }

  getReorderAlerts(
    options?: RequestOptions,
  ): Promise<Response<ReorderAlert[]>> {
    return this._client.get("/api/stock/reorder-alerts", options);
  }

  getStockByLocation(
    locationId: string,
    options?: RequestOptions,
  ): Promise<Response<StockWithProductAndLocation[]>> {
    return this._client.get(`/api/stock/location/${locationId}`, options);
  }

  upsert(
    data: UpsertStockInput,
    options?: RequestOptions,
  ): Promise<Response<UpsertStockResult>> {
    return this._client.post("/api/stock", {
      ...options,
      body: data,
    });
  }

  updateQuantity(
    id: string,
    quantity: number,
    options?: RequestOptions,
  ): Promise<Response<Stock>> {
    return this._client.put(`/api/stock/${id}/quantity`, {
      ...options,
      body: { quantity },
    });
  }

  remove(id: string, options?: RequestOptions): Promise<Response<Stock>> {
    return this._client.delete(`/api/stock/${id}`, options);
  }

  recordMovement(
    data: RecordMovementInput,
    options?: RequestOptions,
  ): Promise<Response<StockMovement>> {
    return this._client.post("/api/stock/movements", {
      ...options,
      body: data,
    });
  }

  receive(
    data: ReceiveInput,
    options?: RequestOptions,
  ): Promise<Response<StockMovement>> {
    return this._client.post("/api/stock/receive", { ...options, body: data });
  }

  issue(
    data: IssueInput,
    options?: RequestOptions,
  ): Promise<Response<StockMovement>> {
    return this._client.post("/api/stock/issue", { ...options, body: data });
  }

  setCountedBalance(
    data: SetCountedBalanceInput,
    options?: RequestOptions,
  ): Promise<Response<Stock>> {
    return this._client.post("/api/stock/set-counted-balance", {
      ...options,
      body: data,
    });
  }

  transfer(
    data: TransferInput,
    options?: RequestOptions,
  ): Promise<Response<{ transferred: number; referenceId: string }>> {
    return this._client.post("/api/stock/transfer", {
      ...options,
      body: data,
    });
  }
}
