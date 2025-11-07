import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  const { id } = await params
  const userId = (session.user as any)?.id
  
  try {
    // Buscar a transação para verificar permissões
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    })

    if (!transaction) {
      return NextResponse.json({ status: 'error', message: 'Transação não encontrada' }, { status: 404 })
    }

    // Verificar se a transação pertence à família do usuário
    if (transaction.familyId !== familyId) {
      return NextResponse.json({ status: 'error', message: 'Acesso negado' }, { status: 403 })
    }

    // Controle de permissões: USER só pode editar suas próprias transações
    if (role === 'USER' && transaction.userId !== userId) {
      return NextResponse.json({ status: 'error', message: 'Você só pode editar suas próprias transações' }, { status: 403 })
    }

    // ADMIN e OWNER podem editar qualquer transação da família
    const { description, amount, date, dueDate, type, status, categoryId } = await req.json()

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        type,
        status,
        categoryId,
      },
      include: {
        category: { select: { name: true, color: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ status: 'ok', transaction: updatedTransaction })
  } catch (error) {
    console.error('[TRANSACTION_PUT]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao atualizar transação', error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  const { id } = await params
  const userId = (session.user as any)?.id

  try {
    // Buscar a transação para verificar permissões
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    })

    if (!transaction) {
      return NextResponse.json({ status: 'error', message: 'Transação não encontrada' }, { status: 404 })
    }

    // Verificar se a transação pertence à família do usuário
    if (transaction.familyId !== familyId) {
      return NextResponse.json({ status: 'error', message: 'Acesso negado' }, { status: 403 })
    }

    // Controle de permissões: USER só pode excluir suas próprias transações
    if (role === 'USER' && transaction.userId !== userId) {
      return NextResponse.json({ status: 'error', message: 'Você só pode excluir suas próprias transações' }, { status: 403 })
    }

    // ADMIN e OWNER podem excluir qualquer transação da família
    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ status: 'ok', message: 'Transação excluída com sucesso' })
  } catch (error) {
    console.error('[TRANSACTION_DELETE]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao excluir transação', error: String(error) },
      { status: 500 }
    )
  }
}

