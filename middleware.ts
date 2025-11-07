import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Mais informações: https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth(
  function middleware(req) {
    // Permite passar para as rotas protegidas
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname

        // CRÍTICO: Rotas do NextAuth devem SEMPRE ser permitidas
        // Essas rotas são necessárias para o funcionamento do sistema de autenticação
        if (pathname.startsWith('/api/auth')) {
          return true
        }

        // Outras rotas públicas
        const publicPaths = [
          '/api/db-check',
          '/api/test-auth',
          '/api/debug-session',
          '/login',
          '/register',
          '/_next',
          '/favicon.ico',
        ]

        // Se for rota pública, permite acesso SEM verificar token
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true
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
        const isPrivatePath = privatePaths.some(path => 
          pathname.startsWith(path)
        )

        // Se não for rota privada, permite acesso (permite outras rotas públicas)
        if (!isPrivatePath) {
          return true
        }

        // Se for rota privada, precisa de token
        if (!token) {
          console.log('[MIDDLEWARE] Token não encontrado para rota:', pathname)
          return false
        }

        // Verifica se o token tem role e familyId
        const hasValidToken = !!(token.role && token.familyId)
        
        if (!hasValidToken) {
          console.log('[MIDDLEWARE] Token inválido (sem role ou familyId):', {
            pathname,
            token: { ...token, id: token.id ? '[HAS_ID]' : '[NO_ID]' }
          })
        }

        return hasValidToken
      }
    },
  }
)

export const config = {
  matcher: [
    // IMPORTANTE: Excluir /api/auth/* do matcher para não bloquear NextAuth
    // Protege apenas rotas específicas
    '/dashboard/:path*',
    // Excluir explicitamente /api/auth e outras rotas públicas
    '/((?!api/auth|_next|favicon.ico|login|register|api/db-check|api/test-auth|api/debug-session).*)',
  ],
}