/**
 * Geração de Resumo Semanal
 * Enviado automaticamente aos domingos às 20:00
 */

import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface WeeklySummaryData {
  income: number
  expenses: number
  balance: number
  topCategories: Array<{ name: string; total: number }>
  nextAppointments: Array<{ title: string; date: Date }>
}

/**
 * Gera resumo semanal para um usuário
 */
export async function generateWeeklySummary(
  userId: string,
  tenantId: string
): Promise<string> {
  try {
    const weekStart = startOfWeek(new Date(), { locale: ptBR })
    const weekEnd = endOfWeek(new Date(), { locale: ptBR })

    // Buscar dados da semana
    const [income, expenses, topCategories, nextAppointments] = await Promise.all([
      // Receitas
      prisma.transaction.aggregate({
        where: {
          familyId: tenantId,
          type: 'income',
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Despesas
      prisma.transaction.aggregate({
        where: {
          familyId: tenantId,
          type: 'expense',
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Top 3 categorias de gastos
      getTop3Categories(tenantId, weekStart, weekEnd),

      // Próximos compromissos da semana
      getNextWeekAppointments(tenantId),
    ])

    const incomeTotal = income._sum.amount || 0
    const expensesTotal = expenses._sum.amount || 0
    const balance = incomeTotal - expensesTotal

    // Montar mensagem
    const summary = `
📊 *Resumão da semana (${format(weekStart, 'dd/MM', { locale: ptBR })} – ${format(weekEnd, 'dd/MM', { locale: ptBR })}):*

💰 *Receitas*: R$ ${incomeTotal.toFixed(2).replace('.', ',')}
💸 *Despesas*: R$ ${expensesTotal.toFixed(2).replace('.', ',')}
📌 *Saldo*: R$ ${Math.abs(balance).toFixed(2).replace('.', ',')} ${balance >= 0 ? 'positivo 🙌' : 'negativo ⚠️'}

🏷 *Top 3 gastos*:
${topCategories
  .map((c, i) => `${i + 1}º ${c.name} – R$ ${c.total.toFixed(2).replace('.', ',')}`)
  .join('\n')}

📅 *Próxima semana*: ${nextAppointments.length} compromisso${nextAppointments.length !== 1 ? 's' : ''}
${nextAppointments
  .map((a) => `• ${a.title} – ${format(a.date, 'dd/MM HH:mm', { locale: ptBR })}`)
  .join('\n')}

💡 _"O segredo do sucesso é a constância de propósito." – Benjamin Disraeli_

🔥 Bora fazer a próxima semana ser ÉPICA! 🚀
    `.trim()

    return summary
  } catch (error) {
    console.error('[WEEKLY_SUMMARY] Erro ao gerar resumo:', error)
    return '❌ Erro ao gerar resumo semanal. Tente novamente mais tarde.'
  }
}

/**
 * Obtém top 3 categorias de gastos
 */
async function getTop3Categories(
  tenantId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<Array<{ name: string; total: number }>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        familyId: tenantId,
        type: 'expense',
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        categoryId: {
          not: null,
        },
      },
      include: {
        category: true,
      },
    })

    // Agrupar por categoria
    const categoryMap = new Map<string, number>()

    for (const transaction of transactions) {
      if (transaction.category) {
        const current = categoryMap.get(transaction.category.name) || 0
        categoryMap.set(transaction.category.name, current + transaction.amount)
      }
    }

    // Converter para array e ordenar
    const categories = Array.from(categoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    return categories
  } catch (error) {
    console.error('[WEEKLY_SUMMARY] Erro ao buscar top categorias:', error)
    return []
  }
}

/**
 * Obtém compromissos da próxima semana
 */
async function getNextWeekAppointments(
  tenantId: string
): Promise<Array<{ title: string; date: Date }>> {
  try {
    const nextWeekStart = startOfWeek(new Date(), { locale: ptBR })
    const nextWeekEnd = endOfWeek(nextWeekStart, { locale: ptBR })

    const appointments = await prisma.commitment.findMany({
      where: {
        familyId: tenantId,
        date: {
          gte: nextWeekStart,
          lte: nextWeekEnd,
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5, // Limitar a 5 compromissos
    })

    return appointments.map((a) => ({
      title: a.title,
      date: a.date,
    }))
  } catch (error) {
    console.error('[WEEKLY_SUMMARY] Erro ao buscar compromissos:', error)
    return []
  }
}

