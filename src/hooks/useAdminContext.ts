'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getAdminContext, setAdminContext, type AdminContext } from '@/lib/context'

/**
 * Hook para gerenciar o contexto do SUPER_ADMIN
 * Retorna o contexto atual e função para alterá-lo
 */
export function useAdminContext() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const [context, setContextState] = useState<AdminContext>('family')

  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      setContextState(getAdminContext(userRole))
    } else {
      setContextState('family')
    }
  }, [userRole])

  const setContext = (newContext: AdminContext) => {
    if (userRole === 'SUPER_ADMIN') {
      setAdminContext(newContext)
      setContextState(newContext)
    }
  }

  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdminMode = isSuperAdmin && context === 'admin'
  const isFamilyMode = !isSuperAdmin || context === 'family'

  return {
    context,
    setContext,
    isSuperAdmin,
    isAdminMode,
    isFamilyMode,
  }
}

