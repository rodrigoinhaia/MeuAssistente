import NextAuth from 'next-auth'
import { authOptions } from './authOptions'

// Handler do NextAuth - DEVE ser exportado como GET e POST
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
