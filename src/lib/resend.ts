import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

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
