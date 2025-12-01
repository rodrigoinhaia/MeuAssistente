import Stripe from 'stripe'
import { config } from './config'

// Inicializar Stripe apenas se a chave estiver configurada
export const stripe = config.stripe.secretKey 
    ? new Stripe(config.stripe.secretKey, {
        apiVersion: '2025-11-17.clover', // Use latest API version
        typescript: true,
      })
    : null

if (!stripe) {
    console.warn('Stripe secret key is missing. Stripe features will not work.')
}

export async function createStripeCustomer(email: string, name: string) {
    if (!stripe) {
        throw new Error('Stripe is not configured')
    }
    return stripe.customers.create({
        email,
        name,
    })
}

export async function createCheckoutSession(
    priceId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string
) {
    if (!stripe) {
        throw new Error('Stripe is not configured')
    }
    return stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
    })
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
    if (!stripe) {
        throw new Error('Stripe is not configured')
    }
    return stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })
}
