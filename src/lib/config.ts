import { z } from 'zod'

const envSchema = z.object({
    // App
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    DATABASE_URL: z.string().min(1),

    // Auth
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Asaas
    ASAAS_API_URL: z.string().url().default('https://sandbox.asaas.com/api/v3'),
    ASAAS_API_KEY: z.string().optional(),

    // Stripe
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
    console.warn('⚠️ Variáveis de ambiente inválidas:', _env.error.format())
}

export const config = {
    app: {
        url: (process.env.NEXT_PUBLIC_APP_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_APP_URL))
            ? process.env.NEXT_PUBLIC_APP_URL
            : 'http://localhost:3000',
        env: process.env.NODE_ENV || 'development',
    },
    stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    asaas: {
        apiUrl: process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3',
        apiKey: process.env.ASAAS_API_KEY,
    },
}
