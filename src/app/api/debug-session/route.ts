import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      status: 'ok',
      hasSession: !!session,
      session: session ? {
        user: {
          name: session.user?.name,
          email: session.user?.email,
          id: (session.user as any)?.id,
          role: (session.user as any)?.role,
          familyId: (session.user as any)?.familyId,
        },
        expires: session.expires,
      } : null,
      message: session 
        ? 'Sessão encontrada' 
        : 'Nenhuma sessão encontrada. Faça login primeiro.',
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao verificar sessão',
      error: String(error)
    }, { status: 500 })
  }
}

