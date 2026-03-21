import { ulid } from "ulid";

export type EntityPrefix =
  | "usr"
  | "ses"
  | "acc"
  | "ver"
  | "res"
  | "clt"
  | "job"
  | "prd"
  | "var"
  | "cat"
  | "brd"
  | "crt"
  | "cti"
  | "wsh"
  | "ord"
  | "odi"
  | "adr"
  | "loc"
  | "stk"
  | "pss"
  | "ppm"
  | "pcm"
  | "pbm"
  | "plm"
  | "pom"
  | "pfo"
  | "sld"
  | "ban"
  | "del"
  | "jwt"
  | "clp"
  | "sup"
  | "eqp"
  | "pco"
  | "stm"
  | "fil"
  | "agt";

const prefixMap: Record<string, EntityPrefix> = {
  user: "usr",
  session: "ses",
  account: "acc",
  verification: "ver",
  resume: "res",
  cover_letter: "clt",
  job: "job",
  product: "prd",
  product_variant: "var",
  category: "cat",
  brand: "brd",
  cart: "crt",
  cart_item: "cti",
  wishlist: "wsh",
  order: "ord",
  order_item: "odi",
  address: "adr",
  location: "loc",
  product_stock: "stk",
  pos_sync_state: "pss",
  pos_product_map: "ppm",
  pos_category_map: "pcm",
  pos_brand_map: "pbm",
  pos_location_map: "plm",
  pos_order_map: "pom",
  pos_field_override: "pfo",
  slide: "sld",
  banner: "ban",
  deal: "del",
  jwt: "jwt",
  cleanup_proposal: "clp",
  supplier: "sup",
  equipment: "eqp",
  product_compatibility: "pco",
  stock_movement: "stm",
  file: "fil",
  agent_session: "agt",
};

export function createID(entity: keyof typeof prefixMap): string {
  const prefix = prefixMap[entity];
  return `${prefix}_${ulid()}`;
}

/** Client may generate this before navigating; must match {@link isAgentSessionId}. */
export function createAgentSessionClientId(): string {
  return createID("agent_session");
}

/** Validates agent session IDs (`agt_` + 26-char ULID body). */
const AGENT_SESSION_ID_RE = /^agt_[0-9A-Z]{26}$/;

export function isAgentSessionId(value: string): boolean {
  return AGENT_SESSION_ID_RE.test(value);
}

export function generateULID(): string {
  return ulid();
}
