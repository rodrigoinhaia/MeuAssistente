import type { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'E-mail', type: 'email', placeholder: 'seu@email.com' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Tentando autenticar com:', credentials)
        
        if (!credentials?.email || !credentials?.password) {
          console.error('Credenciais incompletas')
          throw new Error('E-mail e senha são obrigatórios')
        }

        // Log da query que será executada
        console.log('Buscando usuário com email:', credentials.email)

        // Primeiro, encontrar a família ativa com o usuário ativo
        const userWithfamily = await prisma.user.findFirst({
          where: { 
            email: credentials.email,
            isActive: true, // Verificar se o usuário está ativo
            family: {
              isActive: true
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            familyId: true,
            role: true,
            isActive: true,
            family: {
              select: {
                isActive: true,
              }
            }
          }
        })

        // Log do resultado bruto da query
        console.log('Resultado bruto da query:', userWithfamily)

        console.log('Usuário encontrado:', userWithfamily ? { ...userWithfamily, password: '[REDACTED]' } : null)

        if (!userWithfamily || !userWithfamily.password) {
          console.error('Usuário não encontrado ou inativo')
          throw new Error('Usuário não encontrado ou conta desativada')
        }

        // Verifica se o usuário está ativo (redundante, mas garante)
        if (!userWithfamily.isActive) {
          console.error('Usuário inativo')
          throw new Error('Sua conta está desativada. Entre em contato com o administrador.')
        }

        // Verifica se o family está ativo
        if (!userWithfamily.family?.isActive) {
          console.error('Família inativa')
          throw new Error('Conta da família está desativada')
        }

        console.log('Senha fornecida:', credentials.password)
        console.log('Hash armazenado:', userWithfamily.password)
        console.log('Hash length:', userWithfamily.password?.length)
        console.log('Hash starts with $2:', userWithfamily.password?.startsWith('$2'))
        
        // Verificar se o hash está no formato correto
        if (!userWithfamily.password || !userWithfamily.password.startsWith('$2')) {
          console.error('Hash de senha inválido ou não está no formato bcrypt')
          throw new Error('Erro interno: hash de senha inválido. Contate o administrador.')
        }
        
        const isValid = await bcrypt.compare(credentials.password, userWithfamily.password)
        console.log('Senha válida:', isValid)

        if (!isValid) {
          console.error('Senha inválida - Detalhes:', {
            email: credentials.email,
            passwordLength: credentials.password?.length,
            hashLength: userWithfamily.password?.length,
            hashPrefix: userWithfamily.password?.substring(0, 10),
          })
          throw new Error('Senha inválida')
        }

        const userData = {
          id: userWithfamily.id,
          name: userWithfamily.name,
          email: userWithfamily.email,
          image: null,
          familyId: userWithfamily.familyId,
          role: userWithfamily.role,
        }

        console.log('Retornando dados do usuário:', userData)
        return userData as any
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          familyId: token.familyId as string,
          role: token.role as string,
        }
      }
      console.log('[AUTH_SESSION] Session callback:', {
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
        sessionUser: session.user ? {
          name: session.user.name,
          email: session.user.email,
          id: (session.user as any)?.id,
          role: (session.user as any)?.role,
          familyId: (session.user as any)?.familyId,
        } : null
      })
      return session
    },
    async jwt({ token, user, trigger, session }: { token: JWT; user?: NextAuthUser; trigger?: string; session?: Session }) {
      if (user) {
        token.id = (user as any).id
        token.familyId = (user as any).familyId
        token.role = (user as any).role
        console.log('[AUTH_JWT] JWT callback - User login:', {
          userId: (user as any).id,
          role: (user as any).role,
          familyId: (user as any).familyId
        })
      }
      // Se houver uma atualização de sessão, atualize o token
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      console.log('[AUTH_JWT] JWT callback - Token atual:', {
        hasId: !!token.id,
        hasRole: !!token.role,
        hasFamilyId: !!token.familyId,
        role: token.role,
      })
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} 