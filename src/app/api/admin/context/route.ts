import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'

/**
 * API para gerenciar contexto do SUPER_ADMIN
 * GET: Retorna o contexto atual
 * POST: Define o contexto (apenas SUPER_ADMIN)
 */
export async function GET(req: Request) {
  const { session, role, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  // Apenas SUPER_ADMIN pode usar contexto
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ 
      status: 'ok', 
      context: 'family',
      message: 'Usuários normais sempre estão no contexto família'
    })
  }

  // Tenta pegar do header ou cookie
  const contextHeader = req.headers.get('x-admin-context')
  const context = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'

  return NextResponse.json({ 
    status: 'ok', 
    context,
    role 
  })
}

export async function POST(req: Request) {
  const { session, role, error } = await requireAuth(req, ['SUPER_ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    const { context } = await req.json()

    if (context !== 'family' && context !== 'admin') {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Contexto inválido. Use "family" ou "admin"' 
      }, { status: 400 })
    }

    // Retorna o contexto definido
    return NextResponse.json({ 
      status: 'ok', 
      context,
      message: `Contexto alterado para: ${context === 'admin' ? 'Administrador' : 'Família'}`
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Erro ao definir contexto',
      error: String(error) 
    }, { status: 500 })
  }
}

