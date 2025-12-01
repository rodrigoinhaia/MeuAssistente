import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { config } from '@/lib/config'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        if (!stripe) {
            throw new Error('Stripe is not configured')
        }
        if (!config.stripe.webhookSecret) {
            throw new Error('Stripe webhook secret is missing')
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            config.stripe.webhookSecret
        )
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === 'checkout.session.completed') {
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        // Aqui você deve atualizar o banco de dados
        // Encontrar a família pelo stripeCustomerId ou email
        // Atualizar status da assinatura, etc.
        console.log(`Checkout completed for customer: ${customerId}, subscription: ${subscriptionId}`)
    }

    if (event.type === 'invoice.payment_succeeded') {
        const subscriptionId = session.subscription as string
        // Atualizar status de pagamento
        console.log(`Payment succeeded for subscription: ${subscriptionId}`)
    }

    return new NextResponse(null, { status: 200 })
}
