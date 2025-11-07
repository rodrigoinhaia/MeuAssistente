import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        familyId,
      },
      include: {
        user: { select: { name: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ status: 'error', message: 'Tarefa não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ status: 'ok', task })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar tarefa', error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  const userId = (session.user as any)?.id

  try {
    const { title, description, dueDate, priority, status } = await req.json()

    // Verificar se a tarefa existe e pertence à família
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        familyId,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ status: 'error', message: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Verificar permissões: USER só pode editar suas próprias tarefas, OWNER pode editar qualquer
    if (role === 'USER' && existingTask.userId !== userId) {
      return NextResponse.json({ status: 'error', message: 'Você não tem permissão para editar esta tarefa' }, { status: 403 })
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(priority && { priority }),
        ...(status && { status }),
      },
      include: {
        user: { select: { name: true } },
      },
    })

    return NextResponse.json({ status: 'ok', task })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao atualizar tarefa', error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  const userId = (session.user as any)?.id

  try {
    // Verificar se a tarefa existe e pertence à família
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        familyId,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ status: 'error', message: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Verificar permissões: USER só pode excluir suas próprias tarefas, OWNER pode excluir qualquer
    if (role === 'USER' && existingTask.userId !== userId) {
      return NextResponse.json({ status: 'error', message: 'Você não tem permissão para excluir esta tarefa' }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ status: 'ok', message: 'Tarefa excluída com sucesso' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao excluir tarefa', error: String(error) }, { status: 500 })
  }
}

