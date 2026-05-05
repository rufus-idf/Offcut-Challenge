const CH_API_BASE = 'https://api.company-information.service.gov.uk'

export type CompanyProfile = {
  company_name: string
  company_status: string
  company_number: string
}

// CH numbers are always 8 chars — England/Wales numbers need zero-padding
export function formatCompanyNumber(input: string): string {
  const trimmed = input.trim().toUpperCase()
  if (/^(SC|NI|OC|SO|NC|NL|R0|IP|SP|IC|SI|NP|NV|RC|SR|NO|NR)/.test(trimmed)) return trimmed
  return trimmed.padStart(8, '0')
}

export async function lookupCompany(rawNumber: string): Promise<CompanyProfile | null> {
  const companyNumber = formatCompanyNumber(rawNumber)

  // Companies House uses HTTP Basic Auth: API key as username, empty password
  const credentials = Buffer.from(`${process.env.COMPANIES_HOUSE_API_KEY}:`).toString('base64')

  const res = await fetch(`${CH_API_BASE}/company/${companyNumber}`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Companies House API returned ${res.status}`)

  return res.json()
}
