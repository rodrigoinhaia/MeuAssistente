/**
 * Middleware para verificar se o trial expirou
 * Deve ser chamado antes de permitir acesso ao dashboard
 */

import { prisma } from '@/lib/db'

export async function checkTrialStatus(familyId: string): Promise<{
  isActive: boolean
  isTrial: boolean
  trialEndDate?: Date
  message?: string
}> {
  try {
    // Buscar assinatura ativa ou em trial
    const subscription = await prisma.subscription.findFirst({
      where: {
        familyId,
        status: { in: ['trial', 'active'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      return {
        isActive: false,
        isTrial: false,
        message: 'Nenhuma assinatura encontrada. Por favor, escolha um plano.',
      }
    }

    // Se está em trial, verificar se expirou
    if (subscription.status === 'trial') {
      const now = new Date()
      const trialEndDate = subscription.endDate || new Date()

      if (now > trialEndDate) {
        // Trial expirado - desativar família
        await prisma.family.update({
          where: { id: familyId },
          data: { isActive: false },
        })

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'inactive' },
        })

        return {
          isActive: false,
          isTrial: false,
          trialEndDate,
          message: 'Seu trial de 3 dias expirou. Por favor, escolha um plano para continuar usando o sistema.',
        }
      }

      // Trial ainda ativo
      return {
        isActive: true,
        isTrial: true,
        trialEndDate,
      }
    }

    // Assinatura ativa
    return {
      isActive: true,
      isTrial: false,
    }
  } catch (error) {
    console.error('[CHECK_TRIAL_STATUS]', error)
    return {
      isActive: false,
      isTrial: false,
      message: 'Erro ao verificar status da assinatura.',
    }
  }
}

