import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { createStripeCustomer, createCheckoutSession } from '@/lib/stripe'
import { config } from '@/lib/config'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { planId } = await req.json()

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findFirst({
            where: { email: session.user.email },
            include: { family: true }
        })

        if (!user || !(user as any).family) {
            return NextResponse.json({ error: 'Usuário ou família não encontrados' }, { status: 404 })
        }

        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
        }

        // Mapear planos do sistema para Price IDs do Stripe
        // Isso deve ser configurado no banco ou via variáveis de ambiente
        // Por enquanto, vamos usar um mapa simples ou assumir que o ID do plano no banco bate com o Stripe (improvável)
        // Vamos usar um switch case simples baseado no nome ou preço por enquanto

        let stripePriceId = ''

        // EXEMPLO: Substitua pelos seus Price IDs reais do Stripe
        if (plan.name.toLowerCase().includes('básico')) stripePriceId = 'price_basic_id'
        if (plan.name.toLowerCase().includes('premium')) stripePriceId = 'price_premium_id'
        if (plan.name.toLowerCase().includes('enterprise')) stripePriceId = 'price_enterprise_id'

        // Fallback para teste se não tiver IDs reais
        if (!stripePriceId) {
            // Se não tivermos mapeamento, não podemos prosseguir com Stripe
            // Mas para fins de desenvolvimento, podemos retornar um erro ou usar um ID de teste genérico se configurado
            return NextResponse.json({ error: 'Configuração de preço do Stripe não encontrada para este plano' }, { status: 400 })
        }

        const family = (user as any).family
        let stripeCustomerId = family.stripeCustomerId

        if (!stripeCustomerId) {
            const customer = await createStripeCustomer(user.email, user.name)
            stripeCustomerId = customer.id

            await prisma.family.update({
                where: { id: family.id },
                data: { stripeCustomerId } as any
            })
        }

        const checkoutSession = await createCheckoutSession(
            stripePriceId,
            stripeCustomerId,
            `${config.app.url}/dashboard/subscriptions?success=true`,
            `${config.app.url}/dashboard/checkout?planId=${planId}&canceled=true`
        )

        return NextResponse.json({ url: checkoutSession.url })
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)
        return NextResponse.json({ error: error.message || 'Erro ao criar sessão de checkout' }, { status: 500 })
    }
}
