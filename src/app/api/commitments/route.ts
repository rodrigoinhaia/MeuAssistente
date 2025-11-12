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
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const status = searchParams.get('status')
  try {
    const where: any = { familyId }
    
    // USER só vê seus próprios compromissos
    // OWNER e SUPER_ADMIN vêem todos da família
    if (role === 'USER') {
      where.userId = userId
    }
    
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) }
    }
    if (status) where.status = status
    const commitments = await prisma.commitment.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json({ status: 'ok', commitments })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar compromissos', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  try {
    const { title, description, date, time, status = 'scheduled', googleEventId } = await req.json()
    if (!title || !date) {
      return NextResponse.json({ status: 'error', message: 'Título e data são obrigatórios.' }, { status: 400 })
    }
    const commitment = await prisma.commitment.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        status,
        googleEventId,
        familyId,
        userId,
      },
      include: {
        user: { select: { name: true } },
      },
    })
    return NextResponse.json({ status: 'ok', commitment })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao criar compromisso', error: String(error) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  try {
    const { id, title, description, date, time, status, googleEventId } = await req.json()
    
    if (!id) {
      return NextResponse.json({ status: 'error', message: 'ID do compromisso é obrigatório.' }, { status: 400 })
    }

    // Verificar se o compromisso existe e pertence à família
    const existingCommitment = await prisma.commitment.findFirst({
      where: {
        id,
        familyId,
      },
    })

    if (!existingCommitment) {
      return NextResponse.json({ status: 'error', message: 'Compromisso não encontrado' }, { status: 404 })
    }

    // Verificar permissões: USER só pode editar seus próprios compromissos, OWNER pode editar qualquer
    if (role === 'USER' && existingCommitment.userId !== userId) {
      return NextResponse.json({ status: 'error', message: 'Você não tem permissão para editar este compromisso' }, { status: 403 })
    }

    const commitment = await prisma.commitment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(status && { status }),
        ...(googleEventId !== undefined && { googleEventId }),
      },
      include: {
        user: { select: { name: true } },
      },
    })

    return NextResponse.json({ status: 'ok', commitment })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao atualizar compromisso', error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  try {
    const { id } = await req.json()
    
    if (!id) {
      return NextResponse.json({ status: 'error', message: 'ID do compromisso é obrigatório.' }, { status: 400 })
    }

    // Verificar se o compromisso existe e pertence à família
    const existingCommitment = await prisma.commitment.findFirst({
      where: {
        id,
        familyId,
      },
    })

    if (!existingCommitment) {
      return NextResponse.json({ status: 'error', message: 'Compromisso não encontrado' }, { status: 404 })
    }

    // Verificar permissões: USER só pode excluir seus próprios compromissos, OWNER pode excluir qualquer
    if (role === 'USER' && existingCommitment.userId !== userId) {
      return NextResponse.json({ status: 'error', message: 'Você não tem permissão para excluir este compromisso' }, { status: 403 })
    }

    await prisma.commitment.delete({
      where: { id },
    })

    return NextResponse.json({ status: 'ok', message: 'Compromisso excluído com sucesso' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao excluir compromisso', error: String(error) }, { status: 500 })
  }
} 