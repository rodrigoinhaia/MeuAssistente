import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário é OWNER ou ADMIN
    const user = await prisma.user.findUnique({
      where: {
        email_familyId: {
          email: session.user.email!,
          familyId: session.user.familyId!
        }
      }
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca todas as assinaturas com informações do family e plano
    const subscriptions = await prisma.$queryRaw<Array<{
      id: string
      familyId: string
      familyName: string
      planId: string
      planName: string
      status: string
      startDate: Date
      endDate: Date | null
      price: number
      asaasSubscriptionId?: string | null
    }>>`
      SELECT
        s.id,
        s.family_id as "familyId",
        f.name as "familyName",
        s.plan_id as "planId",
        p.name as "planName",
        s.status,
        s.start_date as "startDate",
        s.end_date as "endDate",
        p.price::numeric as price
      FROM subscriptions s
      JOIN families f ON f.id = s.family_id
      JOIN plans p ON p.id = s.plan_id
    `

    // Formata os dados para o frontend
    const formattedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      startDate: new Date(sub.startDate).toISOString(),
      endDate: sub.endDate ? new Date(sub.endDate).toISOString() : null,
      price: Number(sub.price),
    }))

    return Response.json({ subscriptions: formattedSubscriptions })
  } catch (error: any) {
    console.error('[SUBSCRIPTION_GET]', error)
    return Response.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário é OWNER ou ADMIN
    const user = await prisma.user.findUnique({
      where: {
        email_familyId: {
          email: session.user.email!,
          familyId: session.user.familyId!
        }
      }
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { id, status } = data

    // Atualiza o status da assinatura
    // Atualiza o status e retorna os dados atualizados
    const [subscription] = await prisma.$queryRaw<Array<{
      id: string
      familyId: string
      familyName: string
      planId: string
      planName: string
      status: string
      startDate: Date
      endDate: Date | null
      price: number
      asaasSubscriptionId?: string | null
    }>>`
      UPDATE subscriptions s
      SET status = ${status}
      WHERE s.id = ${id}
      RETURNING
        s.id,
        s.family_id as "familyId",
        f.name as "familyName",
        s.plan_id as "planId",
        p.name as "planName",
        s.status,
        s.start_date as "startDate",
        s.end_date as "endDate",
        p.price::numeric as price
      FROM families f, plans p
      WHERE f.id = s.family_id AND p.id = s.plan_id
    `

    if (!subscription) {
      return Response.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Formata a resposta
    const formattedSubscription = {
      ...subscription,
      startDate: new Date(subscription.startDate).toISOString(),
      endDate: subscription.endDate ? new Date(subscription.endDate).toISOString() : null,
      price: Number(subscription.price),
    }

    return Response.json({ subscription: formattedSubscription })
  } catch (error: any) {
    console.error('[SUBSCRIPTION_PATCH]', error)
    return Response.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
  }
}
