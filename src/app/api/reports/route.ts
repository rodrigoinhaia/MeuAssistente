import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    // SUPER_ADMIN em modo admin: retorna dados agregados de todas as famílias (relatórios de negócio)
    // SUPER_ADMIN em modo família: retorna dados da sua família (comporta-se como OWNER)
    // OUTROS ROLES: retorna dados apenas da família do usuário
    const whereClause = (role === 'SUPER_ADMIN' && context === 'admin') ? {} : { familyId }

    // Receita total (soma de todas as assinaturas ativas)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        ...whereClause,
        status: 'active',
      },
      include: {
        plan: true,
      },
    })

    const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + Number(sub.price)
    }, 0)

    // Contagem de assinaturas ativas
    const activeSubscriptionsCount = activeSubscriptions.length

    // Total de usuários
    const totalUsers = await prisma.user.count({
      where: whereClause,
    })

    // Total de famílias (clientes)
    const totalFamilies = await prisma.family.count({
      where: role === 'SUPER_ADMIN' ? {} : { id: familyId },
    })

    // Receita mensal dos últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenueData = await prisma.subscription.findMany({
      where: {
        ...whereClause,
        status: 'active',
        startDate: { gte: sixMonthsAgo },
      },
      select: {
        price: true,
        startDate: true,
      },
    })

    // Agrupar por mês
    const monthlyRevenueMap = new Map<string, number>()
    monthlyRevenueData.forEach((sub) => {
      const monthKey = sub.startDate.toISOString().substring(0, 7) // YYYY-MM
      const current = monthlyRevenueMap.get(monthKey) || 0
      monthlyRevenueMap.set(monthKey, current + Number(sub.price))
    })

    // Converter para array e formatar
    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6) // Últimos 6 meses
      .map(([month, revenue]) => {
        const date = new Date(month + '-01')
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return {
          month: monthNames[date.getMonth()],
          revenue: Number(revenue.toFixed(2)),
        }
      })

    // Crescimento mensal (comparar último mês com penúltimo)
    let monthlyGrowth = 0
    if (monthlyRevenue.length >= 2) {
      const lastMonth = monthlyRevenue[monthlyRevenue.length - 1].revenue
      const previousMonth = monthlyRevenue[monthlyRevenue.length - 2].revenue
      if (previousMonth > 0) {
        monthlyGrowth = ((lastMonth - previousMonth) / previousMonth) * 100
      }
    }

    // Taxa de churn (assinaturas canceladas no último mês)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        ...whereClause,
        status: 'cancelled',
        updatedAt: { gte: oneMonthAgo },
      },
    })

    const totalSubscriptionsLastMonth = await prisma.subscription.count({
      where: {
        ...whereClause,
        updatedAt: { gte: oneMonthAgo },
      },
    })

    const churnRate = totalSubscriptionsLastMonth > 0 
      ? (cancelledSubscriptions / totalSubscriptionsLastMonth) * 100 
      : 0

    return NextResponse.json({
      status: 'ok',
      reportData: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        activeSubscriptions: activeSubscriptionsCount,
        totalUsers,
        totalfamilys: totalFamilies,
        monthlyGrowth: Number(monthlyGrowth.toFixed(2)),
        churnRate: Number(churnRate.toFixed(2)),
      },
      monthlyRevenue,
    })
  } catch (error) {
    console.error('[REPORTS_GET]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao buscar relatórios', error: String(error) },
      { status: 500 }
    )
  }
}

