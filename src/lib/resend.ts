import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEnquiryEmail({
  buyerWorkshop,
  sellerWorkshop,
  material,
  finish,
  pricePence,
  requestedQty,
  listingUrl,
}: {
  buyerWorkshop: string
  sellerWorkshop: string
  material: string
  finish: string
  pricePence: number
  requestedQty: number
  listingUrl: string
}) {
  const totalPounds = ((pricePence * requestedQty) / 100).toFixed(2)
  const perPiece    = (pricePence / 100).toFixed(2)

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'rufus@i-designfurniture.com',
    subject: `Purchase enquiry: ${buyerWorkshop} wants ${requestedQty}× ${material} from ${sellerWorkshop}`,
    html: `
      <p><strong>${buyerWorkshop}</strong> has sent a purchase enquiry to <strong>${sellerWorkshop}</strong>.</p>
      <table cellpadding="6">
        <tr><td><strong>Item</strong></td><td>${material} — ${finish}</td></tr>
        <tr><td><strong>Qty requested</strong></td><td>${requestedQty}</td></tr>
        <tr><td><strong>Price per piece</strong></td><td>£${perPiece}</td></tr>
        <tr><td><strong>Total value</strong></td><td>£${totalPounds}</td></tr>
      </table>
      <p><a href="${listingUrl}">View listing →</a></p>
      <p style="color:#888;font-size:12px">Forward this to ${sellerWorkshop} to arrange payment and collection.</p>
    `,
  })
}

export async function sendVerificationAlert(workshopName: string, town: string, chNumber: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'rufus@i-designfurniture.com',
    subject: `New verification request: ${workshopName}`,
    html: `
      <p>A workshop has submitted a verification application and is waiting for your approval.</p>
      <table>
        <tr><td><strong>Workshop</strong></td><td>${workshopName}</td></tr>
        <tr><td><strong>Location</strong></td><td>${town}</td></tr>
        <tr><td><strong>CH number</strong></td><td>${chNumber}</td></tr>
      </table>
      <p><a href="https://offcut-challenge.vercel.app/admin">Review in admin panel →</a></p>
    `,
  })
}
