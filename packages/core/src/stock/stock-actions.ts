/**
 * Simplified warehouse action model.
 *
 * All stock changes flow through one of four explicit actions.
 * Each action updates product_stock.quantity and inserts audit rows into stock_movement.
 *
 * | Action               | Movement type(s)   | Balance effect                     |
 * |----------------------|-------------------|------------------------------------|
 * | receive              | in                | +quantity                         |
 * | issue                | out               | -quantity                         |
 * | setCountedBalance    | adjustment        | balance = newQuantity (delta)     |
 * | transfer             | out + in          | -qty at source, +qty at dest      |
 *
 * Movements are audit-only: they record what happened. Balances are the source of truth.
 */

export type WarehouseAction =
  | "receive"
  | "issue"
  | "setCountedBalance"
  | "transfer";

export type MovementTypeForAction =
  | "in"       // receive
  | "out"      // issue, transfer source
  | "adjustment"  // setCountedBalance
  | "return";  // transfer dest (or explicit return; we use "in" for transfer dest for simplicity)

/** Input for receive: add units to a stock record */
export interface ReceiveInput {
  productStockId: string;
  productId: string;
  locationId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
}

/** Input for issue: remove units from a stock record */
export interface IssueInput {
  productStockId: string;
  productId: string;
  locationId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
}

/** Input for setCountedBalance: set absolute quantity after a physical count */
export interface SetCountedBalanceInput {
  productStockId: string;
  productId: string;
  locationId: string;
  newQuantity: number;
  reason?: string;
  referenceId?: string;
  performedBy?: string;
}

/** Input for transfer: move units between two stock records (locations) */
export interface TransferInput {
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
}
