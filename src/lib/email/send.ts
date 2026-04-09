import { Resend } from "resend";
import { DOCUMENT_LABELS } from "@/lib/pricing";
import { getTierName, type SubscriptionTier } from "@/lib/subscriptions";
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
  replyTo?: string;
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
    replyTo: opts.replyTo,
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
  downloadLinks?: { label: string; url: string }[];
  replyTo?: string;
}) {
  const resend = getResend();

  const docList = opts.documentTypes
    .map((dt) => DOCUMENT_LABELS[dt as DocumentType] || dt)
    .map((label) => `&bull; ${label}`)
    .join("<br>");

  const refId = opts.requestId.slice(0, 8).toUpperCase();

  // Build download buttons if links are available
  const downloadSection =
    opts.downloadLinks && opts.downloadLinks.length > 0
      ? `<div style="margin-top:20px;margin-bottom:20px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0C0F14;">Download Your Documents:</p>
          ${opts.downloadLinks
            .map(
              (link) =>
                `<a href="${link.url}" style="display:block;background:#38b6ff;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;text-align:center;margin-bottom:8px;">${link.label} (PDF)</a>`
            )
            .join("")}
          <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;">Download links expire in 7 days.</p>
        </div>`
      : `<p style="margin:20px 0 0;font-size:13px;color:#6B7280;">
          Your documents will be delivered as PDF files. If you have any questions, please contact the management company directly.
        </p>`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    replyTo: opts.replyTo,
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
          <span style="font-size:24px;">&#10003;</span>
        </div>
      </div>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;text-align:center;">Your Documents Are Ready</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;text-align:center;">
        Hi ${opts.requesterName}, your documents for ${opts.propertyAddress} have been completed and approved.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:4px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Reference #${refId}</p>
        <p style="margin:0;font-size:13px;color:#374151;">${docList}</p>
      </div>
      ${downloadSection}
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF;">
      PropertyDocz by XeedlyAI &middot; HOA Document Services
    </p>
  </div>
</body>
</html>`,
  });
}

// ════════════════════════════════════════════════════════════════════
//  SUBSCRIPTION LIFECYCLE EMAILS
// ════════════════════════════════════════════════════════════════════

/** Shared email wrapper for consistent styling */
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#FAFBFC;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:18px;font-weight:700;color:#0C0F14;">PropertyDocz</span>
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;padding:32px;">
      ${content}
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF;">
      PropertyDocz by XeedlyAI &middot; HOA Document Services
    </p>
  </div>
</body>
</html>`;
}

/**
 * 1. Welcome email — sent when a customer creates an account.
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  customerName: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: "Welcome to PropertyDocz",
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;">Welcome, ${opts.customerName}!</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
        Your PropertyDocz account is ready. Here&rsquo;s what you can do:
      </p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
        <li><strong>Track orders</strong> in real time from your account dashboard</li>
        <li><strong>Pre-fill your info</strong> on every order — no re-typing</li>
        <li><strong>Subscribe &amp; save</strong> up to 30% with a monthly plan</li>
      </ul>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://propertydocz.com/account" style="display:inline-block;background:#38b6ff;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          View Your Account
        </a>
      </div>
    `),
  });
}

/**
 * 2. Usage alert — sent when usage hits 80% or 100% of included packages.
 */
export async function sendUsageAlert(opts: {
  to: string;
  customerName: string;
  tier: string;
  packagesUsed: number;
  packagesIncluded: number;
  threshold: 80 | 100;
}) {
  const resend = getResend();
  const tierName = getTierName(opts.tier as SubscriptionTier);
  const isMaxed = opts.threshold >= 100;

  const subject = isMaxed
    ? `You've used all ${opts.packagesIncluded} packages this month`
    : `Heads up — ${opts.packagesUsed} of ${opts.packagesIncluded} packages used`;

  const badgeColor = isMaxed ? "#ef4444" : "#f59e0b";
  const badgeLabel = isMaxed ? "100% Used" : "80% Used";

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject,
    html: emailWrapper(`
      <div style="display:inline-block;background:${badgeColor};color:#ffffff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">
        ${badgeLabel}
      </div>
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0C0F14;">Package Usage Alert</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
        Hi ${opts.customerName}, you&rsquo;ve used <strong>${opts.packagesUsed} of ${opts.packagesIncluded}</strong> packages in your ${tierName} plan this billing cycle.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="background:#E5E7EB;border-radius:99px;height:8px;overflow:hidden;">
          <div style="background:${badgeColor};height:100%;border-radius:99px;width:${Math.min((opts.packagesUsed / opts.packagesIncluded) * 100, 100)}%;"></div>
        </div>
        <p style="margin:8px 0 0;font-size:12px;color:#6B7280;text-align:center;font-family:'JetBrains Mono',monospace;">
          ${opts.packagesUsed} / ${opts.packagesIncluded} packages
        </p>
      </div>
      ${isMaxed
        ? `<p style="margin:0 0 16px;font-size:13px;color:#374151;">
            Additional orders will be billed at standard pricing with your subscription discount applied.
          </p>`
        : `<p style="margin:0 0 16px;font-size:13px;color:#374151;">
            You&rsquo;re getting close! Consider upgrading your plan for more included packages and better overage discounts.
          </p>`
      }
      <div style="text-align:center;">
        <a href="https://propertydocz.com/account" style="display:inline-block;background:#38b6ff;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">
          Manage Subscription
        </a>
      </div>
    `),
  });
}

/**
 * 3. Renewal confirmation — sent when a billing cycle renews and usage resets.
 */
export async function sendRenewalConfirmation(opts: {
  to: string;
  customerName: string;
  tier: string;
  packagesIncluded: number;
  billingCycleEnd: string;
}) {
  const resend = getResend();
  const tierName = getTierName(opts.tier as SubscriptionTier);
  const endDate = new Date(opts.billingCycleEnd).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Your ${tierName} plan has renewed`,
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;background:#ECFDF5;border-radius:50%;padding:12px;">
          <span style="font-size:24px;">&#10003;</span>
        </div>
      </div>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;text-align:center;">Plan Renewed</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;text-align:center;">
        Hi ${opts.customerName}, your ${tierName} subscription has been renewed.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Plan</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#0C0F14;">${tierName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Packages</td>
            <td style="padding:4px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600;color:#38b6ff;">
              0 / ${opts.packagesIncluded} used
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Next renewal</td>
            <td style="padding:4px 0;text-align:right;color:#0C0F14;">${endDate}</td>
          </tr>
        </table>
      </div>
      <p style="margin:20px 0 0;font-size:13px;color:#6B7280;text-align:center;">
        Your usage has been reset. You have ${opts.packagesIncluded} fresh packages available.
      </p>
    `),
  });
}

/**
 * 4. Payment failed — sent when a subscription invoice payment fails.
 */
export async function sendPaymentFailed(opts: {
  to: string;
  customerName: string;
  tier: string;
}) {
  const resend = getResend();
  const tierName = getTierName(opts.tier as SubscriptionTier);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: "Action Required — Payment Failed",
    html: emailWrapper(`
      <div style="display:inline-block;background:#ef4444;color:#ffffff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">
        Payment Failed
      </div>
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0C0F14;">We couldn&rsquo;t process your payment</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
        Hi ${opts.customerName}, the payment for your ${tierName} subscription failed. Please update your payment method to avoid any interruption in service.
      </p>
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#991B1B;">
          Your subscription is currently marked as <strong>past due</strong>. Your included packages remain available, but further renewals will not process until payment is resolved.
        </p>
      </div>
      <div style="text-align:center;">
        <a href="https://propertydocz.com/account" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Update Payment Method
        </a>
      </div>
    `),
  });
}

/**
 * 5. Cancellation confirmation — sent when a subscription is cancelled.
 */
export async function sendCancellationConfirmation(opts: {
  to: string;
  customerName: string;
  tier: string;
}) {
  const resend = getResend();
  const tierName = getTierName(opts.tier as SubscriptionTier);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Your ${tierName} subscription has been cancelled`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;">Subscription Cancelled</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
        Hi ${opts.customerName}, your ${tierName} subscription has been cancelled. We&rsquo;re sorry to see you go.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#374151;">
          You can still place orders at standard pay-per-order pricing. If you change your mind, you can resubscribe anytime from your account page.
        </p>
      </div>
      <div style="text-align:center;">
        <a href="https://propertydocz.com/pricing" style="display:inline-block;background:#38b6ff;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">
          View Plans
        </a>
      </div>
    `),
  });
}

/**
 * 6. Team invitation — sent when a broker/title company invites a team member.
 */
export async function sendTeamInvitation(opts: {
  to: string;
  inviterName: string;
  organizationName: string;
  tier: string;
  inviteUrl: string;
}) {
  const resend = getResend();
  const tierName = getTierName(opts.tier as SubscriptionTier);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `${opts.inviterName} invited you to ${opts.organizationName} on PropertyDocz`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;">You&rsquo;re Invited</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
        ${opts.inviterName} has invited you to join <strong>${opts.organizationName}</strong> on PropertyDocz.
      </p>
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Organization</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#0C0F14;">${opts.organizationName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6B7280;">Plan</td>
            <td style="padding:4px 0;text-align:right;color:#0C0F14;">${tierName}</td>
          </tr>
        </table>
      </div>
      <p style="margin:0 0 20px;font-size:13px;color:#374151;">
        As a team member, your document orders will be covered by the organization&rsquo;s shared package pool — no separate billing required.
      </p>
      <div style="text-align:center;">
        <a href="${opts.inviteUrl}" style="display:inline-block;background:#38b6ff;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Accept Invitation
        </a>
      </div>
    `),
  });
}

/**
 * 7. Monthly subscription report — sent to platform admins.
 */
export async function sendSubscriptionReport(opts: {
  to: string;
  reportMonth: string;
  totalMrr: number;
  activeSubscribers: number;
  newSubscribers: number;
  churned: number;
  usageStats: {
    totalPackagesUsed: number;
    totalPackagesIncluded: number;
  };
  topTier: { name: string; count: number };
  revenueBreakdown: { tier: string; mrr: number; count: number }[];
}) {
  const resend = getResend();
  const mrrFormatted = `$${(opts.totalMrr / 100).toFixed(2)}`;
  const usagePct = opts.usageStats.totalPackagesIncluded > 0
    ? Math.round((opts.usageStats.totalPackagesUsed / opts.usageStats.totalPackagesIncluded) * 100)
    : 0;

  const breakdownRows = opts.revenueBreakdown
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;color:#374151;font-size:13px;">${r.tier}</td>
        <td style="padding:6px 0;text-align:center;font-family:'JetBrains Mono',monospace;font-size:13px;color:#374151;">${r.count}</td>
        <td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#38b6ff;">$${(r.mrr / 100).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Subscription Report — ${opts.reportMonth}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0F14;">Monthly Subscription Report</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">${opts.reportMonth}</p>

      <!-- KPI Grid -->
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#F8F9FA;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">MRR</p>
          <p style="margin:4px 0 0;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#38b6ff;">${mrrFormatted}</p>
        </div>
        <div style="flex:1;background:#F8F9FA;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Active</p>
          <p style="margin:4px 0 0;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#0C0F14;">${opts.activeSubscribers}</p>
        </div>
        <div style="flex:1;background:#F8F9FA;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">New</p>
          <p style="margin:4px 0 0;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#14b8a6;">+${opts.newSubscribers}</p>
        </div>
        <div style="flex:1;background:#F8F9FA;border-radius:8px;padding:12px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Churned</p>
          <p style="margin:4px 0 0;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:${opts.churned > 0 ? '#ef4444' : '#0C0F14'};">${opts.churned}</p>
        </div>
      </div>

      <!-- Usage -->
      <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;">Platform Usage</p>
        <div style="background:#E5E7EB;border-radius:99px;height:8px;overflow:hidden;">
          <div style="background:#8b5cf6;height:100%;border-radius:99px;width:${Math.min(usagePct, 100)}%;"></div>
        </div>
        <p style="margin:8px 0 0;font-size:12px;color:#6B7280;text-align:center;font-family:'JetBrains Mono',monospace;">
          ${opts.usageStats.totalPackagesUsed} / ${opts.usageStats.totalPackagesIncluded} packages (${usagePct}%)
        </p>
      </div>

      <!-- Revenue Breakdown -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="border-bottom:1px solid #E5E7EB;">
            <th style="padding:8px 0;text-align:left;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;">Tier</th>
            <th style="padding:8px 0;text-align:center;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;">Subs</th>
            <th style="padding:8px 0;text-align:right;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;">MRR</th>
          </tr>
        </thead>
        <tbody>${breakdownRows}</tbody>
      </table>
    `),
  });
}
