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
  
  // Inicializa o estado diretamente do localStorage se disponível
  const getInitialContext = (): AdminContext => {
    if (typeof window === 'undefined') return 'family'
    // Tenta ler do localStorage diretamente
    const stored = localStorage.getItem('admin_context')
    return (stored === 'admin' || stored === 'family') ? stored : 'family'
  }
  
  const [context, setContextState] = useState<AdminContext>(getInitialContext)

  // Função para atualizar o contexto do localStorage
  const updateContext = () => {
    if (userRole === 'SUPER_ADMIN') {
      const currentContext = getAdminContext(userRole)
      setContextState(currentContext)
    } else {
      setContextState('family')
    }
  }

  useEffect(() => {
    // Atualiza o contexto quando o userRole muda ou quando o componente monta
    if (userRole === 'SUPER_ADMIN') {
      // Força uma leitura direta do localStorage
      const stored = localStorage.getItem('admin_context')
      const currentContext = (stored === 'admin' || stored === 'family') ? stored : 'family'
      setContextState(currentContext)
    } else {
      setContextState('family')
    }
  }, [userRole])

  // Efeito adicional para garantir que o contexto seja lido após o mount
  useEffect(() => {
    if (typeof window !== 'undefined' && userRole === 'SUPER_ADMIN') {
      const stored = localStorage.getItem('admin_context')
      const currentContext = (stored === 'admin' || stored === 'family') ? stored : 'family'
      setContextState(currentContext)
    }
  }, []) // Executa apenas uma vez após o mount

  // Listener para mudanças no localStorage (quando o contexto é alterado em outra aba/componente)
  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'admin_context') {
          updateContext()
        }
      }

      // Listener para mudanças no localStorage de outras abas
      window.addEventListener('storage', handleStorageChange)

      // Listener customizado para mudanças na mesma aba (usando evento customizado)
      const handleCustomStorageChange = () => {
        // Lê diretamente do localStorage quando o evento é disparado
        const stored = localStorage.getItem('admin_context')
        const currentContext = (stored === 'admin' || stored === 'family') ? stored : 'family'
        setContextState(currentContext)
      }
      window.addEventListener('adminContextChanged', handleCustomStorageChange)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('adminContextChanged', handleCustomStorageChange)
      }
    }
  }, [userRole])

  const setContext = (newContext: AdminContext) => {
    if (userRole === 'SUPER_ADMIN') {
      setAdminContext(newContext)
      setContextState(newContext)
      // Dispara evento customizado para atualizar outros componentes na mesma aba
      window.dispatchEvent(new Event('adminContextChanged'))
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

