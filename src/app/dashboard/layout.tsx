"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import apiClient from '@/lib/axios-config'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }
  
  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200/60">
          <p className="text-xl mb-4 text-slate-800 font-semibold">Você precisa estar autenticado.</p>
          <a href="/login" className="text-cyan-600 hover:text-cyan-700 font-medium underline decoration-2 underline-offset-2">
            Fazer Login
          </a>
        </div>
      </div>
    )
  }

  // Verificar se a sessão tem os dados necessários
  const userRole = (session.user as any)?.role
  const familyId = (session.user as any)?.familyId
  
  // SUPER_ADMIN pode não ter familyId se estiver em modo admin, mas precisa ter família própria
  if (!userRole) {
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

  // SUPER_ADMIN sempre tem familyId (faz parte de uma família)
  // Mas pode alternar entre modo família e modo admin
  if (userRole !== 'SUPER_ADMIN' && !familyId) {
    console.error('[DASHBOARD_LAYOUT] Sessão incompleta (sem familyId):', {
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

  // Verificar status do trial (apenas para OWNER, não para SUPER_ADMIN)
  const [trialStatus, setTrialStatus] = useState<any>(null)
  const [checkingTrial, setCheckingTrial] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (userRole === 'OWNER' && familyId) {
      async function checkTrial() {
        try {
          const res = await apiClient.get(`/subscriptions/check-trial`)
          setTrialStatus(res.data)
          
          // Se trial expirou e não está ativo, redirecionar para upgrade
          if (res.data.trialExpired && !res.data.isActive) {
            router.push('/dashboard/upgrade')
          }
        } catch (err) {
          console.error('Erro ao verificar trial:', err)
        } finally {
          setCheckingTrial(false)
        }
      }
      checkTrial()
    } else {
      setCheckingTrial(false)
    }
  }, [userRole, familyId, router])

  if (checkingTrial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 