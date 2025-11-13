import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  console.log('[TRANSACTIONS_GET] Iniciando requisição')
  try {
    const contextHeader = req.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    console.log('[TRANSACTIONS_GET] Contexto:', adminContext)
    
    let authResult
    try {
      authResult = await requireAuth(req, [], adminContext)
    } catch (authError: any) {
      console.error('[TRANSACTIONS_GET] Erro ao chamar requireAuth:', {
        message: authError?.message,
        stack: authError?.stack,
      })
      return NextResponse.json(
        { status: 'error', message: 'Erro ao verificar autenticação', error: authError?.message || String(authError) },
        { status: 500 }
      )
    }
    
    const { session, role, familyId, error, adminContext: context } = authResult
    if (error) {
      console.error('[TRANSACTIONS_GET] Erro de autenticação:', error)
      return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
    }

    if (!session || !session.user) {
      console.error('[TRANSACTIONS_GET] Sessão inválida')
      return NextResponse.json(
        { status: 'error', message: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const userId = (session.user as any)?.id
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const filterUserId = searchParams.get('userId') // Novo filtro opcional
    
    // SUPER_ADMIN em modo admin NÃO pode ver transações (apenas configurações globais)
    if (role === 'SUPER_ADMIN' && context === 'admin') {
      return NextResponse.json(
        { status: 'error', message: 'Acesso negado. Transações são dados familiares e não estão disponíveis no modo Admin.' },
        { status: 403 }
      )
    }

    // Validar familyId
    if (!familyId) {
      return NextResponse.json(
        { status: 'error', message: 'FamilyId não encontrado na sessão' },
        { status: 400 }
      )
    }

    // SUPER_ADMIN em modo família vê apenas transações da sua família (comporta-se como OWNER)
    // Outros roles filtram por família
    const where: any = { familyId }
    
    // Controle de permissões: USER só vê suas próprias transações
    // OWNER pode ver todas da família ou filtrar por usuário específico
    if (role === 'USER') {
      // USER sempre vê apenas suas próprias transações
      if (!userId) {
        return NextResponse.json(
          { status: 'error', message: 'UserId não encontrado na sessão' },
          { status: 400 }
        )
      }
      where.userId = userId
    } else if (filterUserId) {
      // OWNER pode filtrar por usuário específico se fornecido
      where.userId = filterUserId
    }
    // Se for OWNER e não fornecer filterUserId, vê todas da família
    
    if (startDate && endDate) {
      try {
        where.date = { gte: new Date(startDate), lte: new Date(endDate) }
      } catch (err) {
        console.error('[TRANSACTIONS_GET] Erro ao parsear datas:', err)
      }
    }
    if (type) where.type = type
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    
    console.log('[TRANSACTIONS_GET] Query:', {
      where: {
        ...where,
        date: where.date ? '[Date object]' : undefined,
      },
      role,
      familyId,
      userId,
    })
    
    let transactions
    try {
      console.log('[TRANSACTIONS_GET] Executando query do Prisma...')
      
      // Primeiro, buscar transações sem include para ver se a query básica funciona
      const transactionsCount = await prisma.transaction.count({ where })
      console.log('[TRANSACTIONS_GET] Total de transações encontradas (count):', transactionsCount)
      
      transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: { select: { name: true, color: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: 'desc' },
      })
      console.log('[TRANSACTIONS_GET] Encontradas:', transactions.length, 'transações')
    } catch (prismaError: any) {
      console.error('[TRANSACTIONS_GET] Erro do Prisma:', {
        message: prismaError?.message,
        code: prismaError?.code,
        meta: prismaError?.meta,
        stack: prismaError?.stack,
      })
      
      // Se o erro for relacionado a roles inválidos, sugerir correção
      if (prismaError?.message?.includes("not found in enum 'UserRole'")) {
        console.error('[TRANSACTIONS_GET] ⚠️  Há usuários com roles inválidos no banco. Execute: npx tsx scripts/fix-admin-role.ts');
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Erro ao buscar transações. Há usuários com roles inválidos no banco. Execute o script de correção.',
            error: 'Execute: npx tsx scripts/fix-admin-role.ts para corrigir os dados.'
          }, 
          { status: 500 }
        );
      }
      
      throw prismaError
    }

    // Converter Decimal para Number para serialização JSON
    console.log('[TRANSACTIONS_GET] Serializando transações...')
    const serializedTransactions = transactions.map((tx, index) => {
      try {
        const serialized = {
          id: tx.id,
          familyId: tx.familyId,
          userId: tx.userId,
          categoryId: tx.categoryId,
          bankConnectionId: tx.bankConnectionId,
          bankTransactionId: tx.bankTransactionId,
          amount: Number(tx.amount),
          description: tx.description,
          type: tx.type,
          date: tx.date.toISOString(),
          dueDate: tx.dueDate ? tx.dueDate.toISOString() : null,
          status: tx.status,
          isRecurring: tx.isRecurring,
          recurringType: tx.recurringType,
          aiCategorized: tx.aiCategorized,
          createdAt: tx.createdAt.toISOString(),
          updatedAt: tx.updatedAt.toISOString(),
          category: tx.category,
          user: tx.user ? {
            id: tx.user.id,
            name: tx.user.name,
            email: tx.user.email,
          } : null,
        }
        return serialized
      } catch (err: any) {
        console.error('[TRANSACTIONS_SERIALIZE] Erro ao serializar transação:', {
          index,
          txId: tx.id,
          error: err?.message,
          stack: err?.stack,
        })
        // Retornar versão simplificada em caso de erro
        return {
          id: tx.id,
          amount: Number(tx.amount),
          description: tx.description,
          type: tx.type,
          date: tx.date.toISOString(),
          status: tx.status,
        }
      }
    })

    console.log('[TRANSACTIONS_GET] Serialização concluída. Retornando resposta...')
    return NextResponse.json({ status: 'ok', transactions: serializedTransactions })
  } catch (error: any) {
    console.error('[TRANSACTIONS_GET] Erro completo:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
    })
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro ao buscar transações', 
        error: error?.message || String(error),
        details: process.env.NODE_ENV === 'development' ? {
          name: error?.name,
          code: error?.code,
          meta: error?.meta,
        } : undefined,
      }, 
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  if (!familyId) {
    return NextResponse.json({ status: 'error', message: 'FamilyId é obrigatório' }, { status: 400 })
  }
  
  const userId = (session.user as any)?.id
  try {
    const { description, amount, date, dueDate, type, status = 'pending', categoryId } = await req.json()
    if (!description || !amount || !date || !type) {
      return NextResponse.json({ status: 'error', message: 'Descrição, valor, data e tipo são obrigatórios.' }, { status: 400 })
    }
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        type,
        status,
        categoryId,
        familyId,
        userId,
      },
      include: {
        category: { select: { name: true, color: true } },
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({ status: 'ok', transaction })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao criar transação', error: String(error) }, { status: 500 })
  }
} 