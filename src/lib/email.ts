import { Resend } from "resend";

// Lazy init — prevents "Missing API key" crash during Next.js build-time static evaluation
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "BuildSupply <noreply@buildsupply.dev>";

// ── Shared branded wrapper ─────────────────────────────────────────────────
function emailShell(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
              <span style="color:#f97316;">Build</span>Supply
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              You're receiving this email because you have an account or placed an order with BuildSupply.<br/>
              &copy; ${new Date().getFullYear()} BuildSupply. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">${text}</h1>`;
}
function p(text: string, muted = false) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${muted ? "#64748b" : "#374151"};">${text}</p>`;
}
function divider() {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>`;
}
function badge(text: string, color: string) {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${color}20;color:${color};letter-spacing:0.02em;">${text}</span>`;
}
function ctaButton(text: string, href: string) {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#f97316;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}
function itemsTable(items: { name: string; sku: string; quantity: number; price: number }[]) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${i.sku}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`).join("");
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <thead>
      <tr>
        <th style="padding:8px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;text-align:left;">Item</th>
        <th style="padding:8px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;text-align:center;">SKU</th>
        <th style="padding:8px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;text-align:center;">Qty</th>
        <th style="padding:8px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── 1. Order Confirmation ──────────────────────────────────────────────────
export type OrderConfirmationData = {
  to: string;
  firstName: string;
  orderId: number;
  items: { name: string; sku: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: { address: string; city: string; state: string; zip: string };
  promoCode?: string;
};

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const { to, firstName, orderId, items, subtotal, discount, shipping, tax, total, shippingAddress, promoCode } = data;
  const body = `
    ${h1(`Order Confirmed! 🎉`)}
    ${p(`Hi ${firstName}, thanks for your order. We've received it and are getting it ready.`)}
    ${badge(`Order #${orderId}`, "#f97316")}
    ${divider()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Items Ordered</p>
    ${itemsTable(items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Subtotal</td><td style="text-align:right;font-size:14px;color:#374151;padding:4px 0;">$${subtotal.toFixed(2)}</td></tr>
      ${promoCode ? `<tr><td style="font-size:14px;color:#16a34a;padding:4px 0;">Promo (${promoCode})</td><td style="text-align:right;font-size:14px;color:#16a34a;padding:4px 0;">-$${discount.toFixed(2)}</td></tr>` : ""}
      <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Shipping</td><td style="text-align:right;font-size:14px;color:#374151;padding:4px 0;">${shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</td></tr>
      <tr><td style="font-size:14px;color:#64748b;padding:4px 0;">Tax</td><td style="text-align:right;font-size:14px;color:#374151;padding:4px 0;">$${tax.toFixed(2)}</td></tr>
      <tr><td style="font-size:15px;font-weight:700;color:#0f172a;padding:12px 0 4px;border-top:2px solid #0f172a;">Total</td><td style="text-align:right;font-size:15px;font-weight:700;color:#0f172a;padding:12px 0 4px;border-top:2px solid #0f172a;">$${total.toFixed(2)}</td></tr>
    </table>
    ${divider()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Shipping To</p>
    ${p(`${shippingAddress.address}<br/>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}`)}
    ${ctaButton("View Order", `https://buildsupply.dev/account/orders/${orderId}`)}
    ${p("Questions? Just reply to this email — we're here to help.", true)}
  `;
  return getResend().emails.send({ from: FROM, to: [to], subject: `Order #${orderId} Confirmed — BuildSupply`, html: emailShell(body) });
}

// ── 2. Return Request Confirmation ────────────────────────────────────────
export type ReturnConfirmationData = {
  to: string;
  firstName: string;
  returnId: number;
  orderId: number;
  items: { name: string; sku: string; quantity: number; price: number }[];
  reason: string;
};

export async function sendReturnConfirmation(data: ReturnConfirmationData) {
  const { to, firstName, returnId, orderId, items, reason } = data;
  const body = `
    ${h1("Return Request Received")}
    ${p(`Hi ${firstName}, we've received your return request and our team will review it shortly.`)}
    ${badge(`Return #${returnId}`, "#6366f1")} &nbsp; ${badge(`Order #${orderId}`, "#64748b")}
    ${divider()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Items Requested for Return</p>
    ${itemsTable(items)}
    ${divider()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Reason</p>
    ${p(reason)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0;">
      <tr><td style="padding:16px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0f172a;">What happens next?</p>
        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
          Our team will review your request within 1–2 business days. You'll receive an email once it's approved with instructions on how to ship the items back. Refunds are processed within 3–5 business days of receiving your return.
        </p>
      </td></tr>
    </table>
    ${ctaButton("View Return Status", `https://buildsupply.dev/account/returns`)}
    ${p("Questions? Just reply to this email — we're happy to help.", true)}
  `;
  return getResend().emails.send({ from: FROM, to: [to], subject: `Return #${returnId} Received — BuildSupply`, html: emailShell(body) });
}

// ── 3. Return Status Update ───────────────────────────────────────────────
export type ReturnStatusUpdateData = {
  to: string;
  firstName: string;
  returnId: number;
  orderId: number;
  status: "approved" | "received" | "refunded" | "rejected";
  refundAmount?: number;
  adminNotes?: string;
};

const STATUS_META: Record<string, { label: string; color: string; message: string }> = {
  approved:  { label: "Approved",        color: "#16a34a", message: "Great news! Your return request has been approved. Please ship the items back to us using any trackable carrier and reply to this email with your tracking number." },
  received:  { label: "Items Received",  color: "#0ea5e9", message: "We've received your returned items and are inspecting them. Your refund will be processed within 3–5 business days." },
  refunded:  { label: "Refund Issued",   color: "#8b5cf6", message: "Your refund has been processed and is on its way. Please allow 3–5 business days for the funds to appear depending on your bank." },
  rejected:  { label: "Not Approved",    color: "#ef4444", message: "Unfortunately we weren't able to approve your return request at this time. Please see the note below for more details, or reply to this email if you have questions." },
};

export async function sendReturnStatusUpdate(data: ReturnStatusUpdateData) {
  const { to, firstName, returnId, orderId, status, refundAmount, adminNotes } = data;
  const meta = STATUS_META[status];
  const body = `
    ${h1(`Return Update: ${meta.label}`)}
    ${p(`Hi ${firstName}, here's an update on your return request.`)}
    ${badge(`Return #${returnId}`, meta.color)} &nbsp; ${badge(`Order #${orderId}`, "#64748b")}
    ${divider()}
    ${p(meta.message)}
    ${status === "refunded" && refundAmount ? `<p style="font-size:20px;font-weight:700;color:#8b5cf6;margin:0 0 16px;">Refund Amount: $${refundAmount.toFixed(2)}</p>` : ""}
    ${adminNotes ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0;">
      <tr><td style="padding:16px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Note from our team</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${adminNotes}</p>
      </td></tr>
    </table>` : ""}
    ${ctaButton("View Return Details", `https://buildsupply.dev/account/returns`)}
    ${p("Questions? Just reply to this email.", true)}
  `;
  return getResend().emails.send({ from: FROM, to: [to], subject: `Return #${returnId} Update: ${meta.label} — BuildSupply`, html: emailShell(body) });
}

// ── 4. Quote Ready Notification ───────────────────────────────────────────
export type QuoteReadyData = {
  to: string;
  firstName: string;
  quoteId: number;
  items: { name: string; sku: string; quantity: number; price: number }[];
  notes?: string;
  expiresAt?: string;
  total: number;
};

export async function sendQuoteReady(data: QuoteReadyData) {
  const { to, firstName, quoteId, items, notes, expiresAt, total } = data;
  const expiryStr = expiresAt ? new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
  const body = `
    ${h1("Your Custom Quote is Ready")}
    ${p(`Hi ${firstName}, our team has prepared a custom quote for you. Review the pricing below and accept it when you're ready to checkout.`)}
    ${badge(`Quote #${quoteId}`, "#f97316")}
    ${expiryStr ? `<p style="margin:4px 0 0;font-size:13px;color:#ef4444;">⏳ Expires ${expiryStr}</p>` : ""}
    ${divider()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Quoted Items</p>
    ${itemsTable(items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="font-size:15px;font-weight:700;color:#0f172a;padding:12px 0 4px;border-top:2px solid #0f172a;">Quote Total</td>
        <td style="text-align:right;font-size:15px;font-weight:700;color:#f97316;padding:12px 0 4px;border-top:2px solid #0f172a;">$${total.toFixed(2)}</td>
      </tr>
    </table>
    ${notes ? `
    ${divider()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Note from our team</p>
    ${p(notes)}` : ""}
    ${divider()}
    ${ctaButton("Review & Accept Quote", `https://buildsupply.dev/account/quotes/${quoteId}`)}
    ${p("This quote was prepared specifically for you. If you have questions or want to negotiate, just reply to this email.", true)}
  `;
  return getResend().emails.send({ from: FROM, to: [to], subject: `Your BuildSupply Quote #${quoteId} is Ready`, html: emailShell(body) });
}

// ── 5. Update contact reply to use verified domain ─────────────────────────
export async function sendContactReplyEmail(
  toEmail: string,
  subject: string,
  body: string
) {
  return getResend().emails.send({
    from: FROM,
    to: [toEmail],
    subject,
    html: emailShell(`
      ${h1(subject)}
      <p style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body.replace(/\n/g, "<br/>")}</p>
      ${divider()}
      ${p("This message was sent by the BuildSupply team in response to your inquiry. Reply directly to this email if you have further questions.", true)}
    `),
  });
}


// ── Password reset email ────────────────────────────────────────────────
export type PasswordResetData = {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresAt: string;
};

export async function sendPasswordResetEmail(data: PasswordResetData) {
  const { to, firstName, resetUrl, expiresAt } = data;
  const body = `
    ${h1("Reset Your Password")}
    ${p(`Hi ${firstName},`)}
    ${p("We received a request to reset the password for your BuildSupply account. Click the button below to set a new password.")}
    <div style="text-align:center;margin:32px 0;">
      ${ctaButton("Reset My Password", resetUrl)}
    </div>
    ${p("This link will expire at <strong>" + expiresAt + "</strong> (1 hour from now).", false)}
    ${divider()}
    ${p("If you didn't request a password reset, you can safely ignore this email — your password will not change.", true)}
    ${p("For security, this link can only be used once and expires in 1 hour. If you need a new link, visit the login page and click \"Forgot password?\" again.", true)}
  `;
  return getResend().emails.send({
    from: FROM,
    to: [to],
    subject: "Reset your BuildSupply password",
    html: emailShell(body),
  });
}
