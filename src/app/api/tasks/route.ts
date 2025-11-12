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
  const userId = (session.user as any)?.id
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const dueDate = searchParams.get('dueDate')
  try {
    const where: any = { familyId }
    
    // USER só vê suas próprias tarefas
    // OWNER e SUPER_ADMIN vêem todas da família
    if (role === 'USER') {
      where.userId = userId
    }
    
    if (status) where.status = status
    if (priority) where.priority = priority
    if (dueDate) {
      const date = new Date(dueDate)
      where.dueDate = { gte: date, lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
    }
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    })
    return NextResponse.json({ status: 'ok', tasks })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar tarefas', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  try {
    const { title, description, dueDate, priority = 'medium', status = 'pending', googleTaskId } = await req.json()
    if (!title || !dueDate) {
      return NextResponse.json({ status: 'error', message: 'Título e data de vencimento são obrigatórios.' }, { status: 400 })
    }
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        priority,
        status,
        googleTaskId,
        familyId,
        userId,
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({ status: 'ok', task })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao criar tarefa', error: String(error) }, { status: 500 })
  }
} 