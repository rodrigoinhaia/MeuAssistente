import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || !session.user || ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN')) {
    return NextResponse.json({ status: 'error', message: 'Acesso restrito.' }, { status: 403 })
  }
  try {
    const users = await prisma.user.findMany({
      where: { familyId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ status: 'ok', users })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar usuários', error: String(error) }, { status: 500 })
  }
} 