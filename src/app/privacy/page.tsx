export const metadata = { title: 'Privacy Policy' }

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          ← Back
        </Link>

        <h1 className="mb-2 text-3xl font-black tracking-tight text-stone-900">Privacy Policy</h1>
        <p className="mb-10 text-sm text-stone-400">Last updated: May 2025</p>

        <div className="space-y-8 text-stone-700">

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">1. Who We Are</h2>
            <p className="leading-relaxed">Offcut Challenge is operated by I-Design Furniture Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). We are the data controller for personal data processed through this platform. We are committed to protecting your personal data and complying with UK GDPR and the Data Protection Act 2018.</p>
            <p className="mt-3 leading-relaxed">Contact: <a href="mailto:rufus@i-designfurniture.com" className="text-[#2A9E5A] hover:underline">rufus@i-designfurniture.com</a></p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">2. Data We Collect</h2>
            <p className="mb-3 leading-relaxed">We collect the following categories of data when you use Offcut Challenge:</p>
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Why we collect it</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {[
                    ['Email address', 'Account login and transactional email notifications'],
                    ['Business name, Companies House number, VAT number', 'Workshop verification and account identity'],
                    ['Town, county, postcode', 'Location display and distance-based search'],
                    ['Workshop logo and listing photos', 'Marketplace display'],
                    ['Stock listings and pricing', 'Marketplace functionality'],
                    ['Reviews and ratings', 'Trust and reputation on the platform'],
                    ['API keys (camera integration)', 'Authenticating camera scan requests'],
                    ['Stripe payment and billing data', 'Subscription and transaction processing'],
                    ['Usage data (page visits, actions)', 'Platform improvement and troubleshooting'],
                  ].map(([data, reason]) => (
                    <tr key={data}>
                      <td className="px-4 py-3 font-medium text-stone-800">{data}</td>
                      <td className="px-4 py-3 text-stone-500">{reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">3. Legal Basis for Processing</h2>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li><strong>Contract performance</strong> — processing your data is necessary to deliver the subscription service and marketplace functionality you have signed up for.</li>
              <li><strong>Legitimate interests</strong> — improving the platform, preventing fraud, and maintaining the security of the service.</li>
              <li><strong>Legal obligation</strong> — retaining certain business records as required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">4. How We Share Your Data</h2>
            <p className="mb-3 leading-relaxed">We do not sell your personal data. We share data only with the following third-party service providers, who process it on our behalf:</p>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li><strong>Supabase</strong> — database hosting and authentication (EU data centres).</li>
              <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Vercel</strong> — application hosting (EU region).</li>
              <li><strong>Companies House API</strong> — business verification (public UK government data).</li>
            </ul>
            <p className="mt-3 leading-relaxed">Certain information you publish — your workshop name, location, listing details, and reviews — is visible to other verified Offcut Challenge members as part of the marketplace.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">5. Data Retention</h2>
            <p className="leading-relaxed">We retain your account data for as long as your account is active and for up to 2 years after closure, unless a longer retention period is required by law. Listing and transaction data may be retained for up to 7 years for accounting and legal purposes. You may request earlier deletion (see Your Rights below).</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">6. Your Rights (UK GDPR)</h2>
            <p className="mb-3 leading-relaxed">You have the following rights regarding your personal data:</p>
            <ul className="ml-4 list-disc space-y-2 leading-relaxed">
              <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
              <li><strong>Rectification</strong> — ask us to correct inaccurate data.</li>
              <li><strong>Erasure</strong> — request deletion of your data in certain circumstances.</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Restriction</strong> — ask us to limit how we process your data.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
            </ul>
            <p className="mt-3 leading-relaxed">To exercise any of these rights, email us at <a href="mailto:rufus@i-designfurniture.com" className="text-[#2A9E5A] hover:underline">rufus@i-designfurniture.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#2A9E5A] hover:underline">Information Commissioner&apos;s Office (ICO)</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">7. Cookies</h2>
            <p className="leading-relaxed">We use strictly necessary cookies for authentication (session management via Supabase). We do not use advertising or tracking cookies. No consent banner is required for strictly necessary cookies under UK GDPR.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">8. Security</h2>
            <p className="leading-relaxed">We implement appropriate technical and organisational measures to protect your data, including encrypted connections (HTTPS), row-level security on our database, and API key authentication for camera integrations. No system is completely secure; please notify us immediately if you believe your account has been compromised.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-stone-900">9. Changes to This Policy</h2>
            <p className="leading-relaxed">We may update this Privacy Policy from time to time. Material changes will be communicated by email. The date at the top of this page shows when it was last revised.</p>
          </section>

        </div>

        <div className="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-400">
          <Link href="/terms" className="hover:text-stone-600">Terms &amp; Conditions →</Link>
        </div>
      </div>
    </div>
  )
}
