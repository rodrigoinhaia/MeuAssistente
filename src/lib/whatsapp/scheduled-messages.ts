/**
 * Sistema de Mensagens Proativas Agendadas
 * Resumo diário, lembretes, resumo semanal
 */

import { prisma } from '@/lib/db'
import { generateWeeklySummary } from './weekly-summary'
import { format, startOfDay, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Envia resumo diário (08:00)
 */
export async function sendDailySummary(): Promise<void> {
  try {
    const today = startOfDay(new Date())
    const families = await prisma.family.findMany({
      where: {
        isActive: true,
      },
      include: {
        users: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    for (const family of families) {
      if (family.users.length === 0) continue

      const userId = family.users[0].id

      // Buscar compromissos do dia
      const appointments = await prisma.commitment.findMany({
        where: {
          familyId: family.id,
          date: {
            gte: today,
            lt: addMinutes(today, 24 * 60),
          },
        },
        orderBy: {
          date: 'asc',
        },
      })

      // Buscar transações do dia anterior
      const yesterday = addMinutes(today, -24 * 60)
      const transactions = await prisma.transaction.findMany({
        where: {
          familyId: family.id,
          date: {
            gte: yesterday,
            lt: today,
          },
        },
      })

      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      // Montar mensagem
      let message = `🌅 *Bom dia! Resumo de hoje (${format(today, 'dd/MM', { locale: ptBR })}):*\n\n`

      if (appointments.length > 0) {
        message += `📅 *Compromissos hoje* (${appointments.length}):\n`
        appointments.forEach((apt) => {
          message += `• ${apt.title} - ${format(apt.date, 'HH:mm', { locale: ptBR })}\n`
        })
        message += '\n'
      } else {
        message += `📅 Nenhum compromisso agendado para hoje.\n\n`
      }

      if (transactions.length > 0) {
        message += `💰 *Ontem*:\n`
        message += `💸 Despesas: R$ ${totalExpenses.toFixed(2).replace('.', ',')}\n`
        message += `💰 Receitas: R$ ${totalIncome.toFixed(2).replace('.', ',')}\n`
        message += `📌 Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2).replace('.', ',')}\n\n`
      }

      message += '💡 Tenha um ótimo dia! 🚀'

      // TODO: Enviar mensagem via WhatsApp
      // await sendWhatsAppMessage(family.phoneNumber, message)
      console.log(`[DAILY_SUMMARY] Mensagem para ${family.phoneNumber}:`, message)
    }
  } catch (error) {
    console.error('[SCHEDULED_MESSAGES] Erro ao enviar resumo diário:', error)
  }
}

/**
 * Envia lembretes 30 minutos antes dos compromissos
 */
export async function sendAppointmentReminders(): Promise<void> {
  try {
    const now = new Date()
    const in30Minutes = addMinutes(now, 30)

    const appointments = await prisma.commitment.findMany({
      where: {
        date: {
          gte: now,
          lte: in30Minutes,
        },
      },
      include: {
        family: {
          include: {
            users: {
              take: 1,
            },
          },
        },
      },
    })

    for (const appointment of appointments) {
      const message = `⏰ *Lembrete de Compromisso*\n\n📅 ${appointment.title}\n🕐 ${format(appointment.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n${appointment.location ? `📍 ${appointment.location}\n` : ''}\n💡 Não se esqueça!`

      // TODO: Enviar mensagem via WhatsApp
      // await sendWhatsAppMessage(appointment.family.phoneNumber, message)
      console.log(
        `[APPOINTMENT_REMINDER] Mensagem para ${appointment.family.phoneNumber}:`,
        message
      )
    }
  } catch (error) {
    console.error('[SCHEDULED_MESSAGES] Erro ao enviar lembretes:', error)
  }
}

/**
 * Envia resumo semanal (Domingo 20:00)
 */
export async function sendWeeklySummary(): Promise<void> {
  try {
    const families = await prisma.family.findMany({
      where: {
        isActive: true,
      },
      include: {
        users: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    for (const family of families) {
      if (family.users.length === 0) continue

      const userId = family.users[0].id
      const summary = await generateWeeklySummary(userId, family.id)

      // TODO: Enviar mensagem via WhatsApp
      // await sendWhatsAppMessage(family.phoneNumber, summary)
      console.log(`[WEEKLY_SUMMARY] Mensagem para ${family.phoneNumber}:`, summary)
    }
  } catch (error) {
    console.error('[SCHEDULED_MESSAGES] Erro ao enviar resumo semanal:', error)
  }
}

/**
 * Agenda lembretes para compromissos recém-criados
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  appointmentDate: Date
): Promise<void> {
  try {
    const reminderTime = addMinutes(appointmentDate, -30)

    // TODO: Usar BullMQ ou node-cron para agendar
    // Por enquanto, apenas log
    console.log(
      `[SCHEDULE_REMINDER] Lembrete agendado para ${format(reminderTime, 'dd/MM/yyyy HH:mm')}`
    )

    // Exemplo com BullMQ:
    // await reminderQueue.add('appointment-reminder', {
    //   appointmentId,
    //   reminderTime,
    // }, {
    //   delay: reminderTime.getTime() - Date.now(),
    // })
  } catch (error) {
    console.error('[SCHEDULED_MESSAGES] Erro ao agendar lembrete:', error)
  }
}

