import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, getTrialExpiringEmailTemplate, getTrialExpiredEmailTemplate } from '@/lib/email'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Cron Job para enviar notificações de trial
 * Deve ser chamado diariamente (ex: via Vercel Cron, GitHub Actions, etc)
 * 
 * Configuração no Vercel:
 * - Adicione no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/trial-notifications",
 *     "schedule": "0 9 * * *" // Todo dia às 9h
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  // Verificar se é uma chamada autorizada (ex: header secreto do Vercel Cron)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'change-me-in-production'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
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
      processed: 0,
    }

    for (const subscription of subscriptions) {
      if (!subscription.endDate) continue

      const owner = subscription.family.users[0]
      if (!owner) continue

      const daysRemaining = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Só processar se for 2 dias antes ou expirado
      if (daysRemaining !== 2 && daysRemaining > 0) {
        continue
      }

      results.processed++

      const trialEndDateFormatted = format(subscription.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      const upgradeUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/upgrade`

      try {
        // Trial expirando (2 dias antes)
        if (daysRemaining === 2) {
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
            console.log(`[CRON_TRIAL] Email enviado para ${owner.email} - Trial expirando`)
          } else {
            results.errors++
            console.error(`[CRON_TRIAL_ERROR] Erro ao enviar email para ${owner.email}:`, result.error)
          }
        }

        // Trial expirado
        if (daysRemaining <= 0) {
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
            console.log(`[CRON_TRIAL] Email enviado para ${owner.email} - Trial expirado`)
          } else {
            results.errors++
            console.error(`[CRON_TRIAL_ERROR] Erro ao enviar email para ${owner.email}:`, result.error)
          }
        }
      } catch (error: any) {
        results.errors++
        console.error(`[CRON_TRIAL_ERROR] Erro ao processar ${owner.email}:`, error)
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Cron job executado com sucesso',
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('[CRON_TRIAL_ERROR]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao executar cron job', error: error.message },
      { status: 500 }
    )
  }
}

