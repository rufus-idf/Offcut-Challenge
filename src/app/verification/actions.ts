'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { lookupCompany, formatCompanyNumber } from '@/lib/companies-house'
import { sendVerificationAlert } from '@/lib/resend'

export async function submitVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const rawChNumber = (formData.get('companies_house_number') as string).trim()
  const chNumber = formatCompanyNumber(rawChNumber)
  const vatNumber = (formData.get('vat_number') as string).trim() || null
  const town = (formData.get('town') as string).trim()
  const county = (formData.get('county') as string).trim()
  const postcode = (formData.get('postcode') as string).trim().toUpperCase()

  // Validate against Companies House API
  let company
  try {
    company = await lookupCompany(chNumber)
  } catch {
    redirect(`/verification?error=${encodeURIComponent('Could not reach Companies House — please try again.')}`)
  }

  if (!company) {
    redirect(`/verification?error=${encodeURIComponent(`Company number ${chNumber} was not found on Companies House.`)}`)
  }

  if (company.company_status !== 'active') {
    redirect(`/verification?error=${encodeURIComponent(`${company.company_name} is listed as "${company.company_status}" on Companies House. Only active companies can register.`)}`)
  }

  const { error } = await supabase
    .from('workshops')
    .update({
      companies_house_number: chNumber,
      companies_house_name:   company.company_name,
      vat_number:             vatNumber,
      town,
      county,
      postcode,
      verification_status:    'pending',
    })
    .eq('id', profile.workshop_id)

  if (error) {
    redirect(`/verification?error=${encodeURIComponent(error.message)}`)
  }

  // Fire and forget — don't block the redirect if email fails
  sendVerificationAlert(company.company_name, town, chNumber).catch(() => {})

  revalidatePath('/dashboard')
  redirect(`/dashboard?message=${encodeURIComponent('Application submitted — we will review it within 1 business day')}`)
}
