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

    const userRole = (session.user as any)?.role
    const userFamilyId = (session.user as any)?.familyId

    // SUPER_ADMIN pode ver todas as assinaturas, outros roles só da sua família
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca assinaturas usando Prisma (seguro contra SQL injection)
    const whereClause = userRole === 'SUPER_ADMIN' ? {} : { familyId: userFamilyId }
    
    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        family: {
          select: {
            id: true,
            name: true,
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formata os dados para o frontend
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      familyId: sub.familyId,
      familyName: sub.family.name,
      planId: sub.planId,
      planName: sub.plan.name,
      status: sub.status,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate ? sub.endDate.toISOString() : null,
      price: Number(sub.price),
      asaasSubscriptionId: sub.asaasSubscriptionId,
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

    const userRole = (session.user as any)?.role
    const userFamilyId = (session.user as any)?.familyId

    // SUPER_ADMIN pode editar qualquer assinatura, outros roles só da sua família
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'OWNER') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const data = await request.json()
    const { id, status } = data

    // Verificar se a assinatura existe e se o usuário tem permissão
    const subscriptionToUpdate = await prisma.subscription.findUnique({
      where: { id },
      include: { family: true }
    })

    if (!subscriptionToUpdate) {
      return Response.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // SUPER_ADMIN pode editar qualquer assinatura, outros roles só da sua família
    if (userRole !== 'SUPER_ADMIN' && subscriptionToUpdate.familyId !== userFamilyId) {
      return Response.json({ error: 'Não autorizado para editar esta assinatura' }, { status: 403 })
    }

    // Atualiza o status da assinatura usando Prisma
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: { status },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      }
    })

    // Formata a resposta
    const formattedSubscription = {
      id: updatedSubscription.id,
      familyId: updatedSubscription.familyId,
      familyName: updatedSubscription.family.name,
      planId: updatedSubscription.planId,
      planName: updatedSubscription.plan.name,
      status: updatedSubscription.status,
      startDate: updatedSubscription.startDate.toISOString(),
      endDate: updatedSubscription.endDate ? updatedSubscription.endDate.toISOString() : null,
      price: Number(updatedSubscription.price),
      asaasSubscriptionId: updatedSubscription.asaasSubscriptionId,
    }

    return Response.json({ subscription: formattedSubscription })
  } catch (error: any) {
    console.error('[SUBSCRIPTION_PATCH]', error)
    return Response.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
  }
}
