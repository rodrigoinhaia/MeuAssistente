import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  console.log('[TENANTS_GET] Iniciando requisição')
  try {
    // Apenas SUPER_ADMIN em modo admin pode ver todas as famílias
    const contextHeader = req.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    console.log('[TENANTS_GET] Contexto recebido:', { contextHeader, adminContext })
    
    let authResult
    try {
      authResult = await requireAuth(req, ['SUPER_ADMIN'], adminContext)
    } catch (authError: any) {
      console.error('[TENANTS_GET] Erro ao chamar requireAuth:', {
        message: authError?.message,
        stack: authError?.stack,
      })
      return NextResponse.json(
        { status: 'error', message: 'Erro ao verificar autenticação', error: authError?.message || String(authError) },
        { status: 500 }
      )
    }
    
    if (authResult.error) {
      console.error('[TENANTS_GET] Erro de autenticação:', authResult.error)
      return NextResponse.json({ status: 'error', message: authResult.error.message }, { status: authResult.error.status })
    }

    const { session, role, familyId, adminContext: context } = authResult
    console.log('[TENANTS_GET] Autenticação OK:', { role, context, hasSession: !!session })

    // Apenas em modo admin pode ver todas as famílias
    if (role === 'SUPER_ADMIN' && context !== 'admin') {
      console.warn('[TENANTS_GET] SUPER_ADMIN tentando acessar em modo família')
      return NextResponse.json({ status: 'error', message: 'Acesso apenas no modo Admin. Altere para o modo Admin no menu lateral.' }, { status: 403 })
    }

    // SUPER_ADMIN em modo admin vê todas as famílias (apenas informações básicas, sem dados financeiros)
    const families = await prisma.family.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        subscriptionPlan: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log('[TENANTS_GET] Encontradas:', families.length, 'famílias')
    return NextResponse.json({ status: 'ok', families })
  } catch (error: any) {
    console.error('[TENANTS_GET] Erro completo:', {
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro ao buscar famílias', 
        error: error?.message || String(error),
        details: process.env.NODE_ENV === 'development' ? {
          stack: error?.stack,
        } : undefined,
      }, 
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  // Apenas SUPER_ADMIN em modo admin pode editar famílias
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error } = await requireAuth(req, ['SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  // Apenas em modo admin pode editar famílias
  if (role === 'SUPER_ADMIN' && adminContext !== 'admin') {
    return NextResponse.json({ status: 'error', message: 'Acesso apenas no modo Admin' }, { status: 403 })
  }

  try {
    const { id, name, phoneNumber, subscriptionPlan, isActive } = await req.json()
    if (!id) {
      return NextResponse.json({ status: 'error', message: 'ID da família é obrigatório.' }, { status: 400 })
    }
    const data: any = {}
    if (name) data.name = name
    if (phoneNumber) data.phoneNumber = phoneNumber
    if (subscriptionPlan) data.subscriptionPlan = subscriptionPlan
    if (typeof isActive === 'boolean') data.isActive = isActive
    const family = await prisma.family.update({
      where: { id },
      data,
    })
    return NextResponse.json({ status: 'ok', message: 'Família atualizada com sucesso!', family })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao atualizar família', error: String(error) }, { status: 500 })
  }
}