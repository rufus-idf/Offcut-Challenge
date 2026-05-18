import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Stripe webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Payments ───────────────────────────────────────────────────────────
      case 'payment_intent.succeeded': {
        // TODO Phase 3: mark order as paid, reduce listing qty, email buyer + seller
        console.log('payment_intent.succeeded', event.data.object.id)
        break
      }

      case 'payment_intent.payment_failed': {
        // TODO Phase 3: mark order as payment_failed, notify buyer
        console.log('payment_intent.payment_failed', event.data.object.id)
        break
      }

      // ── Subscriptions ──────────────────────────────────────────────────────
      case 'customer.subscription.created': {
        // TODO Phase 3: set workshop subscription_status = 'active'
        console.log('customer.subscription.created', event.data.object.id)
        break
      }

      case 'customer.subscription.updated': {
        // TODO Phase 3: sync subscription status to workshops table
        console.log('customer.subscription.updated', event.data.object.id, event.data.object.status)
        break
      }

      case 'customer.subscription.deleted': {
        // TODO Phase 3: set subscription_status = 'cancelled', revoke access
        console.log('customer.subscription.deleted', event.data.object.id)
        break
      }

      case 'invoice.payment_failed': {
        // TODO Phase 3: set subscription_status = 'past_due', email workshop
        console.log('invoice.payment_failed', event.data.object.id)
        break
      }

      case 'checkout.session.completed': {
        // TODO Phase 3: fallback handler for subscription checkout completion
        console.log('checkout.session.completed', event.data.object.id, event.data.object.mode)
        break
      }

      // ── Stripe Connect (seller accounts) ───────────────────────────────────
      case 'account.updated': {
        // TODO Phase 3: if charges_enabled → set stripe_onboarding_complete = true
        const account = event.data.object as Stripe.Account
        console.log('account.updated', account.id, 'charges_enabled:', account.charges_enabled)
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    // Return 500 so Stripe retries the event
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
