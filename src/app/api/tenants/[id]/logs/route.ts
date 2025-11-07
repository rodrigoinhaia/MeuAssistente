import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/authOptions'
import { requireAuth } from '@/lib/authorization'
// import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, role, familyId, error } = await requireAuth(req, ['ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  // MVP: retorna array vazio (implementar logs reais depois)
  return NextResponse.json({ status: 'ok', logs: [] })
} 