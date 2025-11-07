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
    const [transactions, tasks, commitments, integrations] = await Promise.all([
      prisma.transaction.count({ where: { familyId: id } }),
      prisma.task.count({ where: { familyId: id } }),
      prisma.commitment.count({ where: { familyId: id } }),
      prisma.integration.count({ where: { familyId: id, isActive: true } }),
    ])
    return NextResponse.json({ status: 'ok', usage: { transactions, tasks, commitments, integrations } })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar uso', error: String(error) }, { status: 500 })
  }
} 