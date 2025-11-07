import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, role, familyId, error } = await requireAuth(req, ['ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    })
    if (!family) {
      return NextResponse.json({ status: 'error', message: 'family não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ status: 'ok', family })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar family', error: String(error) }, { status: 500 })
  }
} 