import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, [], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  // SUPER_ADMIN em modo admin NÃO pode ver estatísticas financeiras (apenas relatórios de negócio)
  if (role === 'SUPER_ADMIN' && context === 'admin') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Estatísticas financeiras são dados familiares e não estão disponíveis no modo Admin. Use a página de Relatórios para métricas de negócio.' },
      { status: 403 }
    )
  }

  try {
    // SUPER_ADMIN em modo família vê estatísticas da sua família (comporta-se como OWNER)
    // Outros roles só da sua família
    const whereBase = { familyId }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    // Receber hoje (transações de receita com data de hoje e status pending ou paid)
    const receiveToday = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'income',
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['pending', 'paid'] },
      },
      _sum: {
        amount: true,
      },
    })

    // Receber restante do mês (transações de receita do mês atual)
    const receiveMonth = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'income',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { in: ['pending', 'paid'] },
      },
      _sum: {
        amount: true,
      },
    })

    // Pagar hoje (transações de despesa com data de hoje e status pending ou paid)
    const payToday = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'expense',
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['pending', 'paid'] },
      },
      _sum: {
        amount: true,
      },
    })

    // Pagar restante do mês (transações de despesa do mês atual)
    const payMonth = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { in: ['pending', 'paid'] },
      },
      _sum: {
        amount: true,
      },
    })

    // Recebimentos em atraso (transações de receita com dueDate passado e status pending)
    const overdueIncome = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'income',
        status: 'pending',
        dueDate: {
          lt: today,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Pagamentos em atraso (transações de despesa com dueDate passado e status pending)
    const overdueExpense = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'expense',
        status: 'pending',
        dueDate: {
          lt: today,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Receitas totais (mês atual)
    const totalIncome = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'income',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'paid',
      },
      _sum: {
        amount: true,
      },
    })

    // Despesas totais (mês atual)
    const totalExpense = await prisma.transaction.aggregate({
      where: {
        ...whereBase,
        type: 'expense',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'paid',
      },
      _sum: {
        amount: true,
      },
    })

    // Saldo (receitas - despesas)
    const income = Number(totalIncome._sum.amount || 0)
    const expense = Number(totalExpense._sum.amount || 0)
    const balance = income - expense

    // Calcular restante do mês (excluindo o que já foi pago/recebido hoje)
    const receiveTodayAmount = Number(receiveToday._sum.amount || 0)
    const receiveMonthAmount = Number(receiveMonth._sum.amount || 0)
    const receiveRemaining = receiveMonthAmount - receiveTodayAmount

    const payTodayAmount = Number(payToday._sum.amount || 0)
    const payMonthAmount = Number(payMonth._sum.amount || 0)
    const payRemaining = payMonthAmount - payTodayAmount

    return NextResponse.json({
      status: 'ok',
      stats: {
        receiveToday: Number(receiveTodayAmount.toFixed(2)),
        receiveRemaining: Number(receiveRemaining.toFixed(2)),
        payToday: Number(payTodayAmount.toFixed(2)),
        payRemaining: Number(payRemaining.toFixed(2)),
        overdueIncome: Number((overdueIncome._sum.amount || 0).toFixed(2)),
        overdueExpense: Number((overdueExpense._sum.amount || 0).toFixed(2)),
        totalIncome: Number(income.toFixed(2)),
        totalExpense: Number(expense.toFixed(2)),
        balance: Number(balance.toFixed(2)),
      },
    })
  } catch (error) {
    console.error('[DASHBOARD_STATS_GET]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao buscar estatísticas do dashboard', error: String(error) },
      { status: 500 }
    )
  }
}

