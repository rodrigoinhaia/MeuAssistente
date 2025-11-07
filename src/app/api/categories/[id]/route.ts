import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    const { id } = await params
    const { name, type, color, icon, isActive } = await req.json()

    // Verificar se a categoria existe e pertence à família
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        familyId,
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ status: 'error', message: 'Categoria não encontrada' }, { status: 404 })
    }

    // Se estiver alterando nome ou tipo, verificar unicidade
    if ((name && name !== existingCategory.name) || (type && type !== existingCategory.type)) {
      const exists = await prisma.category.findFirst({
        where: {
          familyId,
          name: name || existingCategory.name,
          type: type || existingCategory.type,
          id: { not: id },
        },
      })
      if (exists) {
        return NextResponse.json({ status: 'error', message: 'Categoria já existe para este tipo.' }, { status: 400 })
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(color && { color }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ status: 'ok', category })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao atualizar categoria', error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    const { id } = await params

    // Verificar se a categoria existe e pertence à família
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        familyId,
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ status: 'error', message: 'Categoria não encontrada' }, { status: 404 })
    }

    // Verificar se há transações usando esta categoria
    const transactionsCount = await prisma.transaction.count({
      where: {
        categoryId: id,
      },
    })

    if (transactionsCount > 0) {
      return NextResponse.json(
        { status: 'error', message: `Não é possível excluir esta categoria. Ela está sendo usada em ${transactionsCount} transação(ões).` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ status: 'ok', message: 'Categoria excluída com sucesso' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao excluir categoria', error: String(error) }, { status: 500 })
  }
}

