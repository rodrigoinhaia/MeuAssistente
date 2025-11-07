"use client"

import { useSession } from 'next-auth/react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Você precisa estar autenticado.</p>
          <a href="/login" className="text-cyan-400 hover:text-cyan-300 underline">
            Fazer Login
          </a>
        </div>
      </div>
    )
  }

  // Verificar se a sessão tem os dados necessários
  const userRole = (session.user as any)?.role
  const familyId = (session.user as any)?.familyId
  
  if (!userRole || !familyId) {
    console.error('[DASHBOARD_LAYOUT] Sessão incompleta:', {
      hasRole: !!userRole,
      hasFamilyId: !!familyId,
      session: session
    })
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Sessão inválida. Faça login novamente.</p>
          <a href="/login" className="text-cyan-400 hover:text-cyan-300 underline">
            Fazer Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 