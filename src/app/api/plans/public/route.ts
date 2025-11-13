import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/plans/public - Lista planos ativos (público, sem autenticação)
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        features: true,
        maxUsers: true,
        maxStorage: true,
      },
    })

    return NextResponse.json({ status: 'ok', plans })
  } catch (error) {
    console.error('[PLANS_PUBLIC_GET]', error)
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar planos' }, { status: 500 })
  }
}

