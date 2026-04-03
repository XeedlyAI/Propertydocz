import { Resend } from "resend";
import { DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_ADDRESS = "PropertyDocz <noreply@propertydocz.com>";

/**
 * Send order confirmation to the requester.
 */
export async function sendOrderConfirmation(opts: {
  to: string;
  requesterName: string;
  requestId: string;
  documentTypes: string[];
  totalCents: number;
  propertyAddress: string;
}) {
  const resend = getResend();

  const docList = opts.documentTypes
    .map((dt) => DOCUMENT_LABELS[dt as DocumentType] || dt)
    .map((label) => `• ${label}`)
    .join("\n");

  const total = `$${(opts.totalCents / 100).toFixed(2)}`;
  const refId = opts.requestId.slice(0, 8).toUpperCase();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Order Confirmed — Ref #${refId}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#FAFBFC;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:18px;font-weight:700;color:#0C0F14;">PropertyDocz</span>
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;">Order Confirmed</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">
        Hi ${opts.requesterName}, your document order has been received.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Reference</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;font-family:'JetBrains Mono',monospace;color:#0C0F14;">#${refId}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Property</td>
            <td style="padding:4px 0;text-align:right;color:#0C0F14;">${opts.propertyAddress}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Total</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;font-family:'JetBrains Mono',monospace;color:#38b6ff;">${total}</td>
          </tr>
        </table>
      </div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0C0F14;">Documents Ordered:</p>
      <pre style="margin:0 0 24px;font-size:13px;color:#374151;white-space:pre-wrap;font-family:'Inter',sans-serif;">${docList}</pre>
      <p style="margin:0;font-size:13px;color:#6B7280;">
        We'll notify you when your documents are ready for download. Standard turnaround is 3-5 business days; rush orders are completed within 24 hours.
      </p>
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF;">
      PropertyDocz by XeedlyAI &middot; HOA Document Services
    </p>
  </div>
</body>
</html>`,
  });
}

/**
 * Send notification to tenant admin about a new or updated request.
 */
export async function sendAdminNotification(opts: {
  to: string;
  tenantName: string;
  requesterName: string;
  requestId: string;
  propertyAddress: string;
  documentTypes: string[];
  reason: string;
}) {
  const resend = getResend();

  const docList = opts.documentTypes
    .map((dt) => DOCUMENT_LABELS[dt as DocumentType] || dt)
    .join(", ");

  const refId = opts.requestId.slice(0, 8).toUpperCase();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Action Needed — ${opts.reason} (Ref #${refId})`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#FAFBFC;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:18px;font-weight:700;color:#0C0F14;">PropertyDocz</span>
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;padding:32px;">
      <div style="background:#38b6ff;color:#ffffff;display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">
        Action Required
      </div>
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0C0F14;">${opts.reason}</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
        ${opts.tenantName} — a request needs your attention.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Reference</td>
            <td style="padding:4px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600;color:#0C0F14;">#${refId}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Requester</td>
            <td style="padding:4px 0;text-align:right;color:#0C0F14;">${opts.requesterName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Property</td>
            <td style="padding:4px 0;text-align:right;color:#0C0F14;">${opts.propertyAddress}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Documents</td>
            <td style="padding:4px 0;text-align:right;color:#0C0F14;">${docList}</td>
          </tr>
        </table>
      </div>
      <p style="margin:0;font-size:13px;color:#6B7280;">
        Log in to your admin dashboard to review and process this request.
      </p>
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF;">
      PropertyDocz by XeedlyAI &middot; HOA Document Services
    </p>
  </div>
</body>
</html>`,
  });
}

/**
 * Send document-ready notification to requester with download info.
 */
export async function sendDocumentReady(opts: {
  to: string;
  requesterName: string;
  requestId: string;
  propertyAddress: string;
  documentTypes: string[];
}) {
  const resend = getResend();

  const docList = opts.documentTypes
    .map((dt) => DOCUMENT_LABELS[dt as DocumentType] || dt)
    .map((label) => `• ${label}`)
    .join("\n");

  const refId = opts.requestId.slice(0, 8).toUpperCase();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Documents Ready — Ref #${refId}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#FAFBFC;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:18px;font-weight:700;color:#0C0F14;">PropertyDocz</span>
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;padding:32px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;background:#ECFDF5;border-radius:50%;padding:12px;">
          <span style="font-size:24px;">✓</span>
        </div>
      </div>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;text-align:center;">Your Documents Are Ready</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;text-align:center;">
        Hi ${opts.requesterName}, your documents for ${opts.propertyAddress} have been completed and approved.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Reference #${refId}</p>
        <pre style="margin:0;font-size:13px;color:#374151;white-space:pre-wrap;font-family:'Inter',sans-serif;">${docList}</pre>
      </div>
      <p style="margin:0;font-size:13px;color:#6B7280;">
        Your documents will be delivered as PDF files. If you have any questions, please contact the management company directly.
      </p>
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF;">
      PropertyDocz by XeedlyAI &middot; HOA Document Services
    </p>
  </div>
</body>
</html>`,
  });
}
