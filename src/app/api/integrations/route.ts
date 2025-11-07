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
  try {
    const integrations = await prisma.integration.findMany({
      where: { familyId, userId },
      select: {
        id: true,
        provider: true,
        scope: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ status: 'ok', integrations })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar integrações', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  try {
    const { provider, accessToken, refreshToken, expiresAt, scope } = await req.json()
    if (!provider || !accessToken) {
      return NextResponse.json({ status: 'error', message: 'Provider e access token são obrigatórios.' }, { status: 400 })
    }
    // Upsert: cria se não existe, atualiza se existe
    const integration = await prisma.integration.upsert({
      where: {
        familyId_userId_provider: {
          familyId,
          userId,
          provider,
        },
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        scope,
        isActive: true,
      },
      create: {
        provider,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        scope,
        familyId,
        userId,
      },
    })
    return NextResponse.json({ status: 'ok', integration })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar integração', error: String(error) }, { status: 500 })
  }
} 