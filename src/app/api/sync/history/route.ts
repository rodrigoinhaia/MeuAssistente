import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

// GET: Lista os logs do usuário autenticado
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ status: 'error', message: 'Não autenticado.' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const familyId = (session.user as any).familyId
  try {
    const logs = await prisma.syncLog.findMany({
      where: { userId, familyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ status: 'ok', logs })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar logs', error: String(error) }, { status: 500 })
  }
}

// POST: Registra um novo log de sincronização
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ status: 'error', message: 'Não autenticado.' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const familyId = (session.user as any).familyId
  try {
    const { type, status, count, errors, details } = await req.json()
    const log = await prisma.syncLog.create({
      data: {
        type,
        status,
        count,
        errors,
        details,
        userId,
        familyId,
      },
    })
    return NextResponse.json({ status: 'ok', log })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao registrar log', error: String(error) }, { status: 500 })
  }
} 