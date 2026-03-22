/**
 * Preview column width inside the agent split row (already scoped to `SidebarInset`, so the
 * sidebar does not need to be subtracted from the base). Chat column uses `min-w-[22rem]`.
 * Cap 58rem (~928px) so the preview does not dominate ultra-wide displays.
 */
export const agentDocumentPreviewAsideWidthClass =
  'w-[min(58rem,max(32rem,40%))]'
