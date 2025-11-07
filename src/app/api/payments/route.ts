import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/authOptions'

// GET /api/payments - Lista todos os pagamentos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas OWNER e ADMIN podem ver pagamentos
    if ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas OWNER e ADMIN podem atualizar pagamentos
    if ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

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

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        paidDate: status === 'paid' ? new Date() : null,
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento' },
      { status: 500 }
    )
  }
}
