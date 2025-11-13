import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const contextHeader = request.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const authResult = await requireAuth(request, ['SUPER_ADMIN', 'OWNER'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }

    const { role, familyId, adminContext: context } = authResult

    // SUPER_ADMIN em modo admin pode ver todas as assinaturas
    // SUPER_ADMIN em modo família e OWNER só da sua família
    // SEGURANÇA: Se não estiver no modo admin, familyId é obrigatório
    if (role !== 'SUPER_ADMIN' || context !== 'admin') {
      if (!familyId) {
        return NextResponse.json(
          { error: 'FamilyId é obrigatório para este contexto' },
          { status: 400 }
        )
      }
    }
    
    const whereClause = (role === 'SUPER_ADMIN' && context === 'admin') 
      ? {} 
      : { familyId }
    
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

    return NextResponse.json({ subscriptions: formattedSubscriptions })
  } catch (error: any) {
    console.error('[SUBSCRIPTION_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const contextHeader = request.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const authResult = await requireAuth(request, ['SUPER_ADMIN', 'OWNER'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }

    const { role, familyId, adminContext: context } = authResult

    const data = await request.json()
    const { id, status } = data

    // Verificar se a assinatura existe e se o usuário tem permissão
    const subscriptionToUpdate = await prisma.subscription.findUnique({
      where: { id },
      include: { family: true }
    })

    if (!subscriptionToUpdate) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // SUPER_ADMIN em modo admin pode editar qualquer assinatura
    // SUPER_ADMIN em modo família e outros roles só da sua família
    if (role === 'SUPER_ADMIN' && context === 'admin') {
      // Pode editar qualquer
    } else if (subscriptionToUpdate.familyId !== familyId) {
      return NextResponse.json({ error: 'Não autorizado para editar esta assinatura' }, { status: 403 })
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

    return NextResponse.json({ subscription: formattedSubscription })
  } catch (error: any) {
    console.error('[SUBSCRIPTION_PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
  }
}
