export const metadata = { title: 'Terms & Conditions' }

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          ← Back
        </Link>

        <h1 className="mb-2 text-3xl font-black tracking-tight text-stone-900">Terms &amp; Conditions</h1>
        <p className="mb-10 text-sm text-stone-400">Last updated: May 2025</p>

        <div className="space-y-8 text-stone-700">

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">1. About Offcut Challenge</h2>
            <p className="leading-relaxed">Offcut Challenge is a business-to-business online marketplace operated by I-Design Furniture Ltd, registered in England and Wales. We connect verified UK workshops so they can buy and sell material offcuts — timber, metal, plastic, and other workshop offcuts — that would otherwise go to waste.</p>
            <p className="mt-3 leading-relaxed">By registering an account and using the platform you agree to these Terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">2. Eligibility &amp; Verification</h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>Accounts are restricted to registered UK businesses only. You must provide a valid Companies House registration number during onboarding.</li>
              <li>We verify every account before granting marketplace access. We reserve the right to refuse or revoke access at our discretion.</li>
              <li>You are responsible for keeping your login credentials secure. You must notify us immediately of any unauthorised access.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">3. Subscription</h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>Access to the marketplace requires a subscription of <strong>£29 + VAT per month</strong>, billed monthly via Stripe.</li>
              <li>Your subscription grants access to both the stock management tools and the ability to buy and sell on the marketplace.</li>
              <li>You may cancel at any time. Cancellation takes effect at the end of the current billing period — no partial refunds are issued.</li>
              <li>We reserve the right to change subscription pricing with 30 days' written notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">4. Marketplace Transactions</h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>A platform fee of <strong>5% of the sale value</strong> (excluding VAT) is deducted from each completed transaction. This is taken automatically via Stripe Connect at the point of payment.</li>
              <li>Sellers are responsible for accurately describing material, grade, finish, and dimensions. Listings that are materially misleading may be removed.</li>
              <li>Offcut Challenge acts as an intermediary only. We are not a party to the underlying sale contract between buyer and seller.</li>
              <li>All prices on the marketplace are stated per piece, exclusive of VAT unless stated otherwise. Sellers are responsible for their own VAT obligations.</li>
              <li>Shipping, packaging, and collection arrangements are agreed directly between buyer and seller.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">5. Acceptable Use</h2>
            <p className="mb-3 leading-relaxed">You agree not to:</p>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li>List items that are stolen, counterfeit, hazardous, or that you do not own or have the right to sell.</li>
              <li>Misrepresent the condition, size, or origin of any material.</li>
              <li>Use the platform to contact other workshops for purposes unrelated to legitimate offcut transactions.</li>
              <li>Attempt to circumvent platform fees by arranging off-platform payments after an introduction made through Offcut Challenge.</li>
              <li>Scrape, reverse-engineer, or interfere with the platform in any way.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">6. Reviews</h2>
            <p className="leading-relaxed">Reviews submitted through the platform must be honest and based on genuine transactions. Defamatory, fraudulent, or retaliatory reviews will be removed. We reserve the right to remove any review at our discretion.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">7. Intellectual Property</h2>
            <p className="leading-relaxed">You retain ownership of photos and content you upload. By uploading content you grant Offcut Challenge a non-exclusive, royalty-free licence to display it on the platform. You confirm you have the right to upload any content you submit.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">8. Limitation of Liability</h2>
            <p className="leading-relaxed">To the fullest extent permitted by law, Offcut Challenge shall not be liable for any indirect, consequential, or special loss arising from your use of the platform, including disputes between buyers and sellers, loss of profits, or inaccurate listings. Our total liability to you shall not exceed the subscription fees paid by you in the three months preceding the claim.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">9. Changes to These Terms</h2>
            <p className="leading-relaxed">We may update these Terms from time to time. Material changes will be communicated by email at least 14 days before they take effect. Continued use of the platform after that date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">10. Governing Law</h2>
            <p className="leading-relaxed">These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">11. Contact</h2>
            <p className="leading-relaxed">Questions about these Terms should be directed to <a href="mailto:rufus@i-designfurniture.com" className="text-[#2A9E5A] hover:underline">rufus@i-designfurniture.com</a>.</p>
          </section>

        </div>

        <div className="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-400">
          <Link href="/privacy" className="hover:text-stone-600">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  )
}
