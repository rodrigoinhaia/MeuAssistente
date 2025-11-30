import Stripe from 'stripe'
import { config } from './config'

if (!config.stripe.secretKey) {
    console.warn('Stripe secret key is missing. Stripe features will not work.')
}

export const stripe = new Stripe(config.stripe.secretKey || '', {
    apiVersion: '2023-10-16', // Use latest API version
    typescript: true,
})

export async function createStripeCustomer(email: string, name: string) {
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
    return stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })
}
