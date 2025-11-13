import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userRole = (session?.user as any)?.role
  
  // Apenas SUPER_ADMIN em modo admin pode ver usuários de qualquer família
  // OWNER pode ver usuários da sua própria família
  if (!session || !session.user) {
    return NextResponse.json({ status: 'error', message: 'Acesso restrito.' }, { status: 403 })
  }
  
  // Verificar se é SUPER_ADMIN em modo admin
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  const isSuperAdminInAdminMode = userRole === 'SUPER_ADMIN' && adminContext === 'admin'
  
  // Se não for SUPER_ADMIN em modo admin, verificar se é OWNER ou SUPER_ADMIN em modo família
  if (!isSuperAdminInAdminMode) {
    // SUPER_ADMIN em modo família deve se comportar como OWNER
    const isSuperAdminInFamilyMode = userRole === 'SUPER_ADMIN' && adminContext === 'family'
    const isOwner = userRole === 'OWNER'
    
    if (!isOwner && !isSuperAdminInFamilyMode) {
      return NextResponse.json({ status: 'error', message: 'Acesso restrito.' }, { status: 403 })
    }
    // Verificar se a família pertence ao usuário (OWNER ou SUPER_ADMIN em modo família)
    const userFamilyId = (session.user as any)?.familyId
    if (userFamilyId !== id) {
      return NextResponse.json({ status: 'error', message: 'Acesso restrito a esta família.' }, { status: 403 })
    }
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