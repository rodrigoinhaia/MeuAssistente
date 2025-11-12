import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // CRÍTICO: Rotas do NextAuth devem SEMPRE ser permitidas SEM verificação
  // Essas rotas são necessárias para o funcionamento do sistema de autenticação
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Outras rotas públicas - permitir acesso sem autenticação
  const publicPaths = [
    '/api/db-check',
    '/api/test-auth',
    '/api/debug-session',
    '/api/plans/public', // Rota pública para listar planos
    '/api/webhooks/asaas', // Webhook do Asaas (não precisa autenticação)
    '/login',
    '/register',
    '/_next',
    '/favicon.ico',
    '/icon.svg',
    '/api/auth', // Garantir que está incluído
  ]

  // Se for rota pública, permite acesso SEM verificar token
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Rotas que requerem autenticação
  const privatePaths = [
    '/dashboard',
    '/api/users',
    '/api/clients',
    '/api/categories',
    '/api/transactions',
    '/api/subscriptions',
    '/api/payments',
    '/api/reports',
    '/api/n8n',
    '/api/system',
    '/api/dashboard',
  ]

  // Verifica se a rota atual requer autenticação
  const isPrivatePath = privatePaths.some(path => pathname.startsWith(path))

  // Se não for rota privada, permite acesso (permite outras rotas públicas)
  if (!isPrivatePath) {
    return NextResponse.next()
  }

  // Se for rota privada, precisa de token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  if (!token) {
    console.log('[MIDDLEWARE] Token não encontrado para rota:', pathname)
    
    // Se for rota de API, retorna 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    // Se for rota de página, redireciona para login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verifica se o token tem role e familyId
  const hasValidToken = !!(token.role && token.familyId)
  
  if (!hasValidToken) {
    console.log('[MIDDLEWARE] Token inválido (sem role ou familyId):', {
      pathname,
      token: { ...token, id: token.id ? '[HAS_ID]' : '[NO_ID]' }
    })
    
    // Se for rota de API, retorna 403 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 403 }
      )
    }
    
    // Se for rota de página, redireciona para login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token válido, permite acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (icon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
