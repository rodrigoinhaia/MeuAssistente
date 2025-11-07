import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userRole = (session.user as any)?.role
    const familyId = (session.user as any)?.familyId

    if (!familyId) {
      return NextResponse.json({ error: 'Família não encontrada' }, { status: 404 })
    }

    // Buscar assinatura
    const subscription = await prisma.subscription.findFirst({
      where: {
        familyId,
        status: { in: ['trial', 'active'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    })

    if (!subscription) {
      return NextResponse.json({
        isActive: false,
        isTrial: false,
        trialExpired: false,
        message: 'Nenhuma assinatura encontrada',
      })
    }

    const now = new Date()
    const isTrial = subscription.status === 'trial'
    const trialEndDate = subscription.endDate
    const trialExpired = isTrial && trialEndDate && now > trialEndDate

    // Se trial expirou, desativar
    if (trialExpired) {
      await prisma.family.update({
        where: { id: familyId },
        data: { isActive: false },
      })

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'inactive' },
      })
    }

    // Verificar se família está ativa
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { isActive: true },
    })

    return NextResponse.json({
      isActive: family?.isActive || false,
      isTrial,
      trialExpired,
      trialEndDate: trialEndDate?.toISOString(),
      subscriptionStatus: subscription.status,
      planName: subscription.plan.name,
      daysRemaining: trialEndDate
        ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
    })
  } catch (error) {
    console.error('[CHECK_TRIAL]', error)
    return NextResponse.json({ error: 'Erro ao verificar trial' }, { status: 500 })
  }
}

