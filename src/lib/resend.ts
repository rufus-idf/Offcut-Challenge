import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = 'rufus@i-designfurniture.com'

// Set RESEND_FROM in your environment once your domain is verified in Resend.
// Format: "Offcut Challenge <noreply@yourdomain.com>"
// Falls back to the Resend test sender during development.
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

// ─── Enquiry email ───────────────────────────────────────────────────────────

export async function sendEnquiryEmail({
  sellerEmail,
  sellerWorkshop,
  buyerEmail,
  buyerWorkshop,
  material,
  finish,
  pricePence,
  effectivePricePence,
  discountPct,
  requestedQty,
  listingUrl,
}: {
  sellerEmail: string
  sellerWorkshop: string
  buyerEmail: string
  buyerWorkshop: string
  material: string
  finish: string
  pricePence: number
  effectivePricePence?: number
  discountPct?: number | null
  requestedQty: number
  listingUrl: string
}) {
  const effectivePrice  = effectivePricePence ?? pricePence
  const discountApplied = !!(discountPct && effectivePricePence && effectivePricePence < pricePence)
  const perPiece        = (pricePence / 100).toFixed(2)
  const discountedPer   = (effectivePrice / 100).toFixed(2)
  const totalPounds     = ((effectivePrice * requestedQty) / 100).toFixed(2)
  const savedPounds     = discountApplied ? (((pricePence - effectivePrice) * requestedQty) / 100).toFixed(2) : null

  // Primary email → seller
  await resend.emails.send({
    from:    FROM,
    to:      sellerEmail,
    replyTo: buyerEmail,   // seller hits Reply and it goes straight to the buyer
    subject: `New enquiry from ${buyerWorkshop}: ${requestedQty}× ${material}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1C1C1E">

        <div style="background:#1C1C1E;padding:20px 24px;border-radius:12px 12px 0 0">
          <span style="color:#fff;font-size:1.1rem;font-weight:700">Offcut</span><span style="color:#3DBE72;font-size:1.1rem;font-weight:700">Challenge</span>
        </div>

        <div style="border:1px solid #e5e5e0;border-top:none;border-radius:0 0 12px 12px;padding:28px 24px">
          <h2 style="margin:0 0 6px;font-size:1.15rem">New purchase enquiry</h2>
          <p style="margin:0 0 20px;color:#6b6b6a;font-size:0.9rem">
            <strong style="color:#1C1C1E">${buyerWorkshop}</strong> wants to buy from your listing.
            Reply to this email to contact them directly.
          </p>

          <div style="background:#f5f5f3;border-radius:8px;padding:16px;margin-bottom:24px">
            <table cellpadding="5" style="width:100%;font-size:0.88rem">
              <tr>
                <td style="color:#6b6b6a;width:130px">Item</td>
                <td><strong>${material} — ${finish}</strong></td>
              </tr>
              <tr>
                <td style="color:#6b6b6a">Qty requested</td>
                <td><strong>${requestedQty} piece${requestedQty !== 1 ? 's' : ''}</strong></td>
              </tr>
              <tr>
                <td style="color:#6b6b6a">Price per piece</td>
                <td>
                  ${discountApplied
                    ? `<span style="text-decoration:line-through;color:#aaa">£${perPiece}</span> <strong style="color:#2A9E5A">£${discountedPer} (${discountPct}% bulk discount)</strong>`
                    : `<strong>£${perPiece}</strong>`}
                </td>
              </tr>
              <tr>
                <td style="color:#6b6b6a">Total value</td>
                <td><strong style="color:#2A9E5A;font-size:1rem">£${totalPounds}${savedPounds ? ` <span style="font-size:0.8rem;font-weight:normal">(saving £${savedPounds})</span>` : ''}</strong></td>
              </tr>
            </table>
          </div>

          <div style="background:#E8F7EE;border-radius:8px;padding:14px;margin-bottom:24px;font-size:0.88rem">
            <p style="margin:0 0 4px;font-weight:600;color:#1C7040">Buyer contact</p>
            <p style="margin:0;color:#2A9E5A">
              ${buyerWorkshop} &mdash; <a href="mailto:${buyerEmail}" style="color:#2A9E5A">${buyerEmail}</a>
            </p>
          </div>

          <a href="${listingUrl}"
             style="display:inline-block;background:#3DBE72;color:#fff;padding:11px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:0.9rem">
            View listing →
          </a>

          <p style="margin-top:28px;font-size:0.78rem;color:#aeaeac">
            You received this because you have an active listing on Offcut Challenge.
            Payments and collections are arranged directly between workshops until our
            integrated checkout is live.
          </p>
        </div>

      </div>
    `,
  })

  // Silent monitoring copy → admin (so you can see enquiry volume)
  if (sellerEmail !== ADMIN_EMAIL) {
    resend.emails.send({
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject: `[Enquiry] ${buyerWorkshop} → ${sellerWorkshop}: ${requestedQty}× ${material}`,
      html:    `<p>Seller notified at <strong>${sellerEmail}</strong>. Buyer: ${buyerEmail}. <a href="${listingUrl}">View listing</a></p>`,
    }).catch(() => {})
  }
}

// ─── Verification alert ──────────────────────────────────────────────────────

export async function sendVerificationAlert(workshopName: string, town: string, chNumber: string) {
  await resend.emails.send({
    from:    FROM,
    to:      ADMIN_EMAIL,
    subject: `New verification request: ${workshopName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1C1C1E">
        <div style="background:#1C1C1E;padding:20px 24px;border-radius:12px 12px 0 0">
          <span style="color:#fff;font-size:1.1rem;font-weight:700">Offcut</span><span style="color:#3DBE72;font-size:1.1rem;font-weight:700">Challenge</span>
        </div>
        <div style="border:1px solid #e5e5e0;border-top:none;border-radius:0 0 12px 12px;padding:28px 24px">
          <h2 style="margin:0 0 16px">New verification application</h2>
          <div style="background:#f5f5f3;border-radius:8px;padding:16px;margin-bottom:24px">
            <table cellpadding="5" style="font-size:0.88rem;width:100%">
              <tr><td style="color:#6b6b6a;width:130px">Workshop</td><td><strong>${workshopName}</strong></td></tr>
              <tr><td style="color:#6b6b6a">Location</td><td>${town}</td></tr>
              <tr><td style="color:#6b6b6a">CH number</td><td>${chNumber}</td></tr>
            </table>
          </div>
          <a href="https://offcut-challenge.vercel.app/admin"
             style="display:inline-block;background:#3DBE72;color:#fff;padding:11px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:0.9rem">
            Review in admin panel →
          </a>
        </div>
      </div>
    `,
  })
}
