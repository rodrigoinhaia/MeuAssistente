import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, role, familyId, error } = await requireAuth(req, ['ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { familyId: id },
      select: {
        id: true,
        planId: true,
        status: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json({ status: 'ok', subscriptions })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar assinaturas', error: String(error) }, { status: 500 })
  }
} 