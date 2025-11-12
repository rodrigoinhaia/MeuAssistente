import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apenas OWNER e SUPER_ADMIN podem editar categorias
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  // SUPER_ADMIN em modo admin NÃO pode editar categorias (apenas configurações globais)
  if (role === 'SUPER_ADMIN' && context === 'admin') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Categorias são dados familiares e não estão disponíveis no modo Admin.' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const { name, type, color, icon, isActive } = await req.json()

    // Verificar se a categoria existe e pertence à família
    if (!familyId) {
      return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
    }

    const validFamilyId: string = familyId

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        familyId: validFamilyId,
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ status: 'error', message: 'Categoria não encontrada' }, { status: 404 })
    }

    // Se estiver alterando nome ou tipo, verificar unicidade
    if ((name && name !== existingCategory.name) || (type && type !== existingCategory.type)) {
      const exists = await prisma.category.findFirst({
        where: {
          familyId: validFamilyId,
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
  // Apenas OWNER e SUPER_ADMIN podem excluir categorias
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  // SUPER_ADMIN em modo admin NÃO pode excluir categorias (apenas configurações globais)
  if (role === 'SUPER_ADMIN' && context === 'admin') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Categorias são dados familiares e não estão disponíveis no modo Admin.' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    // Verificar se a categoria existe e pertence à família
    if (!familyId) {
      return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
    }

    const validFamilyId: string = familyId

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        familyId: validFamilyId,
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

