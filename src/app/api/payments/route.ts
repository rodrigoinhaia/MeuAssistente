import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

// GET /api/payments - Lista todos os pagamentos
export async function GET(request: NextRequest) {
  try {
    const contextHeader = request.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const authResult = await requireAuth(request, ['SUPER_ADMIN', 'OWNER'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }
    
    const { role, familyId, adminContext: context } = authResult
    
    // SUPER_ADMIN em modo admin vê todos os pagamentos
    // SUPER_ADMIN em modo família e OWNER vê apenas pagamentos da sua família
    const whereClause = (role === 'SUPER_ADMIN' && context === 'admin') 
      ? {} 
      : { familyId }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos' },
      { status: 500 }
    )
  }
}

// PATCH /api/payments/:id - Atualiza o status de um pagamento
export async function PATCH(request: NextRequest) {
  try {
    const contextHeader = request.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const authResult = await requireAuth(request, ['SUPER_ADMIN', 'OWNER'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }
    
    const { role, familyId, adminContext: context } = authResult

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled', 'failed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Verificar se o pagamento existe e se o usuário tem permissão
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { family: true }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // SUPER_ADMIN em modo admin pode editar qualquer pagamento
    // SUPER_ADMIN em modo família e OWNER só da sua família
    if (role === 'SUPER_ADMIN' && context === 'admin') {
      // Pode editar qualquer
    } else if (payment.familyId !== familyId) {
      return NextResponse.json({ error: 'Não autorizado para editar este pagamento' }, { status: 403 })
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        paidDate: status === 'paid' ? new Date() : null,
      },
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento' },
      { status: 500 }
    )
  }
}
