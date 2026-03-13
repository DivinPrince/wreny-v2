import { Resend } from "resend";
import type { Order, OrderItem, AddressSnapshot } from "../order/order.sql";

// ─── Configuration ───────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM || "1000 Hills <noreply@1000hills.rw>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
const STORE_NAME = "1000 Hills";
const BRAND = "#0db114";
const SUPPORT_EMAIL =
  EMAIL_FROM.match(/<(.+)>/)?.[1] ?? "support@1000hills.rw";

export const resend =
  RESEND_API_KEY && RESEND_API_KEY !== "re_xxxxxxxxxxxx"
    ? new Resend(RESEND_API_KEY)
    : null;

export const isEmailConfigured = resend !== null;

// ─── Types ───────────────────────────────────────────────────

export type OrderItemWithLocation = OrderItem & {
  pickupLocationName: string | null;
};

export type OrderEmailData = {
  order: Order;
  items: OrderItemWithLocation[];
};

// ─── Formatting Helpers ──────────────────────────────────────

function formatMoney(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString("en-US")}`;
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function formatAddress(addr: AddressSnapshot): string {
  return [
    `${addr.firstName} ${addr.lastName}`,
    addr.company,
    addr.street1,
    addr.street2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
    addr.phone,
  ]
    .filter(Boolean)
    .join("<br>");
}

function paymentMethodLabel(method: string | null): string {
  switch (method) {
    case "stripe":
      return "Credit / Debit Card";
    case "paypal":
      return "PayPal";
    case "cod":
      return "Cash on Delivery";
    case "check":
      return "Bank Transfer / Check";
    default:
      return method ?? "—";
  }
}

function orderUrl(): string {
  return `${FRONTEND_URL}/account`;
}

// ─── Shared Inline-Style Constants ───────────────────────────

const FONT =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const S = {
  text: `font-family:${FONT};`,
  h2: `margin:0;font-family:${FONT};font-size:24px;font-weight:700;color:#111;line-height:1.3;`,
  p: `margin:0;font-family:${FONT};font-size:15px;color:#555;line-height:1.6;`,
  label: `margin:0 0 8px;font-family:${FONT};font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;`,
  value14: `font-family:${FONT};font-size:14px;color:#111;`,
  muted14: `font-family:${FONT};font-size:14px;color:#777;`,
} as const;

// ─── HTML Building Blocks ────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${STORE_NAME}</title>
<!--[if mso]><style>table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    ${body}
  </table>
  ${footerBlock()}
</td></tr>
</table>
</body>
</html>`;
}

function brandBar(): string {
  return `<tr><td style="background:${BRAND};padding:28px 40px;text-align:center;">
  <span style="${S.text}font-size:18px;font-weight:700;color:#fff;letter-spacing:0.5px;">${STORE_NAME}</span>
</td></tr>`;
}

function heading(title: string, subtitle?: string): string {
  return `<tr><td style="padding:36px 40px 20px;text-align:center;">
  <h2 style="${S.h2}">${title}</h2>
  ${subtitle ? `<p style="${S.p}margin-top:10px;">${subtitle}</p>` : ""}
</td></tr>`;
}

function footerBlock(): string {
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:16px;">
<tr><td style="padding:20px 40px;text-align:center;">
  <p style="${S.text}font-size:13px;color:#888;margin:0 0 6px;line-height:1.5;">Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
  <p style="${S.text}font-size:12px;color:#aaa;margin:0;">&copy; ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
</td></tr>
</table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
<td style="padding:5px 0;${S.muted14}width:140px;vertical-align:top;">${label}</td>
<td style="padding:5px 0;${S.value14}font-weight:500;">${value}</td>
</tr>`;
}

function infoBox(
  rows: string,
  bg = "#f9fafb",
  border = "#e5e7eb",
): string {
  return `<tr><td style="padding:0 40px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:8px;border:1px solid ${border};">
  <tr><td style="padding:18px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  </td></tr>
  </table>
</td></tr>`;
}

function orderMeta(order: Order): string {
  return infoBox(
    [
      infoRow("Order", `<strong>#${order.orderNumber}</strong>`),
      infoRow("Date", formatDate(order.createdAt)),
      order.paymentMethod
        ? infoRow("Payment", paymentMethodLabel(order.paymentMethod))
        : "",
    ].join(""),
  );
}

function itemRow(item: OrderItemWithLocation, currency: string): string {
  const badge =
    item.deliveryMethod === "pickup"
      ? `<span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:11px;font-weight:600;color:#7c3aed;background:#f5f3ff;border-radius:4px;">PICKUP${item.pickupLocationName ? ` &mdash; ${item.pickupLocationName}` : ""}</span>`
      : `<span style="display:inline-block;margin-top:4px;padding:2px 8px;font-size:11px;font-weight:600;color:#0369a1;background:#f0f9ff;border-radius:4px;">DELIVERY</span>`;

  const img = item.image
    ? `<td style="padding:12px 12px 12px 0;vertical-align:top;width:56px;">
        <img src="${item.image}" alt="" width="52" height="52" style="display:block;border-radius:6px;object-fit:cover;border:1px solid #e5e7eb;">
       </td>`
    : `<td style="padding:12px 12px 12px 0;vertical-align:top;width:56px;">
        <div style="width:52px;height:52px;background:#f3f4f6;border-radius:6px;border:1px solid #e5e7eb;"></div>
       </td>`;

  return `<tr>
  ${img}
  <td style="padding:12px 0;vertical-align:top;">
    <p style="margin:0;${S.text}font-size:14px;font-weight:600;color:#111;line-height:1.4;">${item.name}</p>
    ${item.sku ? `<p style="margin:2px 0 0;${S.text}font-size:12px;color:#999;">SKU: ${item.sku}</p>` : ""}
    ${badge}
  </td>
  <td style="padding:12px 0;vertical-align:top;text-align:right;white-space:nowrap;">
    <p style="margin:0;${S.text}font-size:13px;color:#777;">&times;${item.quantity}</p>
    <p style="margin:4px 0 0;${S.text}font-size:14px;font-weight:600;color:#111;">${formatMoney(item.total, currency)}</p>
  </td>
</tr>
<tr><td colspan="3" style="border-bottom:1px solid #f3f4f6;"></td></tr>`;
}

function itemsSection(items: OrderItemWithLocation[], currency: string): string {
  return `<tr><td style="padding:0 40px;">
  <p style="${S.label}">Items</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${items.map((i) => itemRow(i, currency)).join("")}
  </table>
</td></tr>`;
}

function totalsSection(order: Order): string {
  const c = order.currency;
  const row = (label: string, val: string, style = "") =>
    `<tr>
      <td style="padding:4px 0;${S.text}font-size:14px;color:#555;${style}">${label}</td>
      <td style="padding:4px 0;${S.text}font-size:14px;color:#111;text-align:right;${style}">${val}</td>
    </tr>`;

  let rows = row("Subtotal", formatMoney(order.subtotal, c));
  rows += row(
    "Shipping",
    order.shippingAmount > 0 ? formatMoney(order.shippingAmount, c) : "Free",
  );

  if (order.discountAmount && order.discountAmount > 0) {
    rows += row(
      `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
      `&minus;${formatMoney(order.discountAmount, c)}`,
      "color:#16a34a;",
    );
  }

  if (order.taxAmount && order.taxAmount > 0) {
    rows += row("Tax", formatMoney(order.taxAmount, c));
  }

  rows += `<tr><td colspan="2" style="padding:8px 0;border-bottom:2px solid #e5e7eb;"></td></tr>`;
  rows += `<tr>
    <td style="padding:12px 0 0;${S.text}font-size:16px;font-weight:700;color:#111;">Total</td>
    <td style="padding:12px 0 0;${S.text}font-size:16px;font-weight:700;color:#111;text-align:right;">${formatMoney(order.total, c)}</td>
  </tr>`;

  return `<tr><td style="padding:24px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</td></tr>`;
}

function addressSection(order: Order): string {
  const addr = (title: string, a: AddressSnapshot) =>
    `<td style="padding:0;vertical-align:top;">
      <p style="${S.label}">${title}</p>
      <p style="${S.text}font-size:14px;color:#333;line-height:1.6;margin:0;">${formatAddress(a)}</p>
    </td>`;

  const showBilling =
    order.billingAddress &&
    JSON.stringify(order.billingAddress) !==
      JSON.stringify(order.shippingAddress);

  if (!showBilling) {
    return `<tr><td style="padding:0 40px 28px;">
      <p style="${S.label}">Shipping Address</p>
      <p style="${S.text}font-size:14px;color:#333;line-height:1.6;margin:0;">${formatAddress(order.shippingAddress)}</p>
    </td></tr>`;
  }

  return `<tr><td style="padding:0 40px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${addr("Shipping Address", order.shippingAddress)}
    <td style="width:24px;"></td>
    ${addr("Billing Address", order.billingAddress!)}
  </tr></table>
</td></tr>`;
}

function cta(text: string, url: string): string {
  return `<tr><td style="padding:8px 40px 36px;text-align:center;">
  <a href="${url}" target="_blank" style="display:inline-block;background:${BRAND};color:#fff;${S.text}font-size:15px;font-weight:600;padding:14px 36px;text-decoration:none;border-radius:8px;">${text}</a>
</td></tr>`;
}

function note(html: string): string {
  return `<tr><td style="padding:8px 40px 16px;">
  <p style="${S.p}">${html}</p>
</td></tr>`;
}

function divider(): string {
  return `<tr><td style="padding:0 40px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>`;
}

function spacer(h = 16): string {
  return `<tr><td style="height:${h}px;"></td></tr>`;
}

// ─── Email Templates ─────────────────────────────────────────

function orderConfirmationHtml(data: OrderEmailData): string {
  const { order, items } = data;
  const isOnline =
    order.paymentMethod === "stripe" || order.paymentMethod === "paypal";
  const isCOD = order.paymentMethod === "cod";

  let subtitle: string;
  if (isOnline && order.paymentStatus !== "paid") {
    subtitle =
      "Your order has been received and is awaiting payment confirmation.";
  } else if (isCOD) {
    subtitle =
      "Your order has been confirmed. Please have your payment ready upon delivery.";
  } else if (order.paymentMethod === "check") {
    subtitle =
      "Your order has been received. We&rsquo;ll begin processing once payment is confirmed.";
  } else {
    subtitle = "Your order has been confirmed and is being prepared.";
  }

  return layout(
    [
      brandBar(),
      heading("Order Confirmed", subtitle),
      orderMeta(order),
      itemsSection(items, order.currency),
      totalsSection(order),
      divider(),
      spacer(24),
      addressSection(order),
      cta("View Order", orderUrl()),
    ].join(""),
  );
}

function paymentReceiptHtml(data: OrderEmailData): string {
  const { order, items } = data;

  const paymentRows = [
    infoRow(
      "Status",
      `<span style="color:${BRAND};font-weight:700;">Paid</span>`,
    ),
    infoRow("Method", paymentMethodLabel(order.paymentMethod)),
    order.paymentIntentId
      ? infoRow(
          "Transaction",
          `<code style="font-size:12px;background:#e5e7eb;padding:2px 6px;border-radius:3px;">${order.paymentIntentId}</code>`,
        )
      : "",
  ].join("");

  return layout(
    [
      brandBar(),
      heading(
        "Payment Received",
        `Your payment of <strong>${formatMoney(order.total, order.currency)}</strong> has been confirmed.`,
      ),
      orderMeta(order),
      infoBox(paymentRows, "#f0fdf4", "#bbf7d0"),
      itemsSection(items, order.currency),
      totalsSection(order),
      divider(),
      spacer(24),
      addressSection(order),
      cta("View Order", orderUrl()),
    ].join(""),
  );
}

function orderShippedHtml(data: OrderEmailData): string {
  const { order, items } = data;

  const tracking = order.trackingNumber
    ? `<tr><td style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
        <tr><td style="padding:20px 24px;">
          <p style="${S.label}">Tracking Information</p>
          <p style="${S.text}font-size:18px;font-weight:700;color:#1d4ed8;margin:0;letter-spacing:0.5px;">${order.trackingNumber}</p>
          ${order.trackingUrl ? `<p style="margin:8px 0 0;"><a href="${order.trackingUrl}" style="${S.text}font-size:14px;color:${BRAND};text-decoration:none;font-weight:500;">Track your package &rarr;</a></p>` : ""}
        </td></tr>
        </table>
      </td></tr>`
    : "";

  return layout(
    [
      brandBar(),
      heading(
        "Your Order Has Shipped!",
        `Order #${order.orderNumber} is on its way to you.`,
      ),
      tracking,
      orderMeta(order),
      itemsSection(items, order.currency),
      spacer(8),
      divider(),
      spacer(24),
      addressSection(order),
      order.trackingUrl
        ? cta("Track Package", order.trackingUrl)
        : cta("View Order", orderUrl()),
    ].join(""),
  );
}

function orderDeliveredHtml(data: OrderEmailData): string {
  const { order, items } = data;

  return layout(
    [
      brandBar(),
      heading(
        "Order Delivered",
        `Order #${order.orderNumber} has been delivered successfully.`,
      ),
      orderMeta(order),
      itemsSection(items, order.currency),
      totalsSection(order),
      note(
        "We hope you enjoy your purchase! If anything isn&rsquo;t right, please don&rsquo;t hesitate to reach out.",
      ),
      cta("Continue Shopping", `${FRONTEND_URL}/shop`),
    ].join(""),
  );
}

function paymentFailedHtml(order: Order): string {
  const alertRows = [
    infoRow("Order", `<strong>#${order.orderNumber}</strong>`),
    infoRow(
      "Amount",
      `<strong>${formatMoney(order.total, order.currency)}</strong>`,
    ),
    infoRow(
      "Status",
      `<span style="color:#dc2626;font-weight:700;">Payment Failed</span>`,
    ),
  ].join("");

  return layout(
    [
      brandBar(),
      heading(
        "Payment Issue",
        `We weren&rsquo;t able to process your payment for order #${order.orderNumber}.`,
      ),
      infoBox(alertRows, "#fef2f2", "#fecaca"),
      note(
        "This can happen for several reasons including insufficient funds, an expired card, or a bank decline. Please try again with a different payment method or contact your bank for more information.",
      ),
      cta("Retry Payment", orderUrl()),
    ].join(""),
  );
}

function refundConfirmationHtml(order: Order): string {
  const refundRows = [
    infoRow("Order", `<strong>#${order.orderNumber}</strong>`),
    infoRow(
      "Refund Amount",
      `<strong>${formatMoney(order.total, order.currency)}</strong>`,
    ),
    infoRow("Method", paymentMethodLabel(order.paymentMethod)),
    infoRow(
      "Status",
      `<span style="color:${BRAND};font-weight:700;">Refunded</span>`,
    ),
  ].join("");

  return layout(
    [
      brandBar(),
      heading(
        "Refund Processed",
        `A refund has been issued for order #${order.orderNumber}.`,
      ),
      infoBox(refundRows, "#f0fdf4", "#bbf7d0"),
      note(
        "The refund has been initiated and should appear in your account within 5&ndash;10 business days, depending on your payment provider.",
      ),
      cta("View Order", orderUrl()),
    ].join(""),
  );
}

// ─── Auth Email Templates ────────────────────────────────────

function verificationEmailHtml(url: string): string {
  return layout(
    [
      brandBar(),
      heading(
        "Verify Your Email",
        "Thanks for signing up! Please confirm your email address to get started.",
      ),
      cta("Verify Email", url),
      note(
        `If the button doesn&rsquo;t work, copy and paste this link into your browser:<br><a href="${url}" style="color:${BRAND};word-break:break-all;font-size:13px;">${url}</a>`,
      ),
      `<tr><td style="padding:0 40px 32px;">
        <p style="${S.text}font-size:12px;color:#999;margin:0;">If you didn&rsquo;t create an account, you can safely ignore this email.</p>
      </td></tr>`,
    ].join(""),
  );
}

function passwordResetHtml(url: string): string {
  return layout(
    [
      brandBar(),
      heading(
        "Reset Your Password",
        "We received a request to reset your password. Click the button below to create a new one.",
      ),
      cta("Reset Password", url),
      note(
        `If the button doesn&rsquo;t work, copy and paste this link into your browser:<br><a href="${url}" style="color:${BRAND};word-break:break-all;font-size:13px;">${url}</a>`,
      ),
      `<tr><td style="padding:0 40px 32px;">
        <p style="${S.text}font-size:12px;color:#999;margin:0;">If you didn&rsquo;t request this, your password will remain unchanged.</p>
      </td></tr>`,
    ].join(""),
  );
}

// ─── Send Helpers ────────────────────────────────────────────

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (!resend) {
    console.warn(
      `[Email] Resend not configured. Skipping "${subject}" to ${to}`,
    );
    return;
  }
  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

// ─── Public Send Functions ───────────────────────────────────

export async function sendOrderConfirmationEmail(
  email: string,
  data: OrderEmailData,
): Promise<void> {
  await send(
    email,
    `Order Confirmed — #${data.order.orderNumber}`,
    orderConfirmationHtml(data),
  );
}

export async function sendPaymentReceiptEmail(
  email: string,
  data: OrderEmailData,
): Promise<void> {
  await send(
    email,
    `Payment Receipt — #${data.order.orderNumber}`,
    paymentReceiptHtml(data),
  );
}

export async function sendOrderShippedEmail(
  email: string,
  data: OrderEmailData,
): Promise<void> {
  await send(
    email,
    `Your Order Has Shipped — #${data.order.orderNumber}`,
    orderShippedHtml(data),
  );
}

export async function sendOrderDeliveredEmail(
  email: string,
  data: OrderEmailData,
): Promise<void> {
  await send(
    email,
    `Order Delivered — #${data.order.orderNumber}`,
    orderDeliveredHtml(data),
  );
}

export async function sendPaymentFailedEmail(
  email: string,
  order: Order,
): Promise<void> {
  await send(
    email,
    `Payment Issue — Order #${order.orderNumber}`,
    paymentFailedHtml(order),
  );
}

export async function sendRefundConfirmationEmail(
  email: string,
  order: Order,
): Promise<void> {
  await send(
    email,
    `Refund Processed — #${order.orderNumber}`,
    refundConfirmationHtml(order),
  );
}

export async function sendVerificationEmail(
  email: string,
  url: string,
): Promise<void> {
  await send(email, "Verify your 1000 Hills account", verificationEmailHtml(url));
}

export async function sendPasswordResetEmail(
  email: string,
  url: string,
): Promise<void> {
  await send(
    email,
    "Reset your 1000 Hills password",
    passwordResetHtml(url),
  );
}
