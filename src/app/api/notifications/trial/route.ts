import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, getTrialExpiringEmailTemplate, getTrialExpiredEmailTemplate } from '@/lib/email'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * API para enviar notificações de trial
 * Pode ser chamada manualmente ou por cron job
 */
export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json().catch(() => ({}))
    
    // Buscar todas as assinaturas em trial
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'trial',
      },
      include: {
        family: {
          include: {
            users: {
              where: {
                role: 'OWNER',
                isActive: true,
              },
              take: 1,
            },
          },
        },
        plan: true,
      },
    })

    const now = new Date()
    const results = {
      expiring: 0, // 2 dias antes
      expired: 0,
      errors: 0,
    }

    for (const subscription of subscriptions) {
      if (!subscription.endDate) continue

      const owner = subscription.family.users[0]
      if (!owner) continue

      const daysRemaining = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      const trialEndDateFormatted = format(subscription.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      const upgradeUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/upgrade`

      try {
        // Trial expirando (2 dias antes)
        if (daysRemaining === 2 && (type === 'expiring' || !type)) {
          const html = getTrialExpiringEmailTemplate({
            userName: owner.name,
            planName: subscription.plan.name,
            daysRemaining: 2,
            trialEndDate: trialEndDateFormatted,
            upgradeUrl,
          })

          const result = await sendEmail({
            to: owner.email,
            subject: `⏰ Seu trial está acabando! ${daysRemaining} dias restantes`,
            html,
          })

          if (result.success) {
            results.expiring++
            console.log(`[TRIAL_NOTIFICATION] Email enviado para ${owner.email} - Trial expirando`)
          } else {
            results.errors++
            console.error(`[TRIAL_NOTIFICATION_ERROR] Erro ao enviar email para ${owner.email}:`, result.error)
          }
        }

        // Trial expirado
        if (daysRemaining <= 0 && (type === 'expired' || !type)) {
          const html = getTrialExpiredEmailTemplate({
            userName: owner.name,
            planName: subscription.plan.name,
            upgradeUrl,
          })

          const result = await sendEmail({
            to: owner.email,
            subject: '🔒 Seu trial expirou - Escolha um plano para continuar',
            html,
          })

          if (result.success) {
            results.expired++
            console.log(`[TRIAL_NOTIFICATION] Email enviado para ${owner.email} - Trial expirado`)
          } else {
            results.errors++
            console.error(`[TRIAL_NOTIFICATION_ERROR] Erro ao enviar email para ${owner.email}:`, result.error)
          }
        }
      } catch (error: any) {
        results.errors++
        console.error(`[TRIAL_NOTIFICATION_ERROR] Erro ao processar ${owner.email}:`, error)
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Notificações processadas',
      results,
    })
  } catch (error: any) {
    console.error('[TRIAL_NOTIFICATION_ERROR]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao processar notificações', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET para verificar status das notificações
 */
export async function GET(req: NextRequest) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'trial',
      },
      include: {
        family: {
          include: {
            users: {
              where: {
                role: 'OWNER',
                isActive: true,
              },
              take: 1,
            },
          },
        },
        plan: true,
      },
    })

    const now = new Date()
    const stats = {
      total: subscriptions.length,
      expiring: 0, // 2 dias antes
      expired: 0,
      active: 0,
    }

    for (const subscription of subscriptions) {
      if (!subscription.endDate) continue

      const daysRemaining = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysRemaining <= 0) {
        stats.expired++
      } else if (daysRemaining === 2) {
        stats.expiring++
      } else {
        stats.active++
      }
    }

    return NextResponse.json({
      status: 'ok',
      stats,
    })
  } catch (error: any) {
    console.error('[TRIAL_NOTIFICATION_GET_ERROR]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao buscar estatísticas', error: error.message },
      { status: 500 }
    )
  }
}

