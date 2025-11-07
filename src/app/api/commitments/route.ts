import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const status = searchParams.get('status')
  try {
    const where: any = { familyId }
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) }
    }
    if (status) where.status = status
    const commitments = await prisma.commitment.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json({ status: 'ok', commitments })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar compromissos', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  try {
    const { title, description, date, time, status = 'scheduled', googleEventId } = await req.json()
    if (!title || !date) {
      return NextResponse.json({ status: 'error', message: 'Título e data são obrigatórios.' }, { status: 400 })
    }
    const commitment = await prisma.commitment.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        status,
        googleEventId,
        familyId,
        userId,
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({ status: 'ok', commitment })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao criar compromisso', error: String(error) }, { status: 500 })
  }
} 