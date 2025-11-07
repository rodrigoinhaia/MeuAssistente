import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, [], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
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
  
  try {
    // SUPER_ADMIN em modo família vê apenas transações da sua família (comporta-se como OWNER)
    // Outros roles filtram por família
    const where: any = { familyId }
    
    // Controle de permissões: USER só vê suas próprias transações
    // OWNER pode ver todas da família ou filtrar por usuário específico
    if (role === 'USER') {
      // USER sempre vê apenas suas próprias transações
      where.userId = userId
    } else if (filterUserId) {
      // OWNER pode filtrar por usuário específico se fornecido
      where.userId = filterUserId
    }
    // Se for OWNER e não fornecer filterUserId, vê todas da família
    
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) }
    }
    if (type) where.type = type
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: { select: { name: true, color: true } },
        user: { select: { id: true, name: true, email: true } }, // Incluir id e email para identificação
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ status: 'ok', transactions })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar transações', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
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