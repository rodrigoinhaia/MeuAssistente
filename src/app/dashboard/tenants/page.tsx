'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/axios-config'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'

interface Family {
  id: string
  name: string
  phoneNumber: string
  subscriptionPlan: string
  isActive: boolean
  createdAt: string
}

const planLabels: Record<string, string> = {
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

export default function FamiliesPage() {
  const { data: session, status } = useSession()
  const { isAdminMode } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editFamily, setEditFamily] = useState<Family | null>(null)
  const [filter, setFilter] = useState('')

  async function fetchFamilies() {
    // Verificar se está no modo admin antes de fazer a requisição
    if (!isAdminMode || userRole !== 'SUPER_ADMIN') {
      setError('Você precisa estar no modo Admin para ver esta página. Altere para o modo Admin no menu lateral.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/tenants')
      if (res.data.status === 'ok') {
        setFamilies(res.data.families || [])
      } else {
        setError(res.data.message || 'Erro ao carregar famílias')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar famílias'
      // Não logar como erro se for apenas questão de permissão
      if (err.response?.status === 403) {
        setError('Você precisa estar no modo Admin para ver esta página. Altere para o modo Admin no menu lateral.')
      } else {
        console.error('[TENANTS_PAGE] Erro ao buscar famílias:', errorMessage)
        setError(errorMessage)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    // Apenas SUPER_ADMIN em modo admin pode ver esta página
    if (status === 'authenticated' && userRole === 'SUPER_ADMIN') {
      // Verifica diretamente o localStorage para garantir que está atualizado
      const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_context') : null
      const currentContext = (stored === 'admin' || stored === 'family') ? stored : 'family'
      const isInAdminMode = currentContext === 'admin'
      
      if (isInAdminMode) {
        fetchFamilies()
      } else {
        setError('Você precisa estar no modo Admin para ver esta página. Altere para o modo Admin no menu lateral.')
        setLoading(false)
      }
    } else if (status === 'authenticated' && userRole !== 'SUPER_ADMIN') {
      setError('Acesso restrito. Apenas Super Admins podem acessar esta página.')
      setLoading(false)
    }
  }, [status, session, isAdminMode, userRole])


  async function handleStatusChange(id: string, isActive: boolean) {
    // Verificar se está no modo admin antes de fazer a requisição
    if (!isAdminMode || userRole !== 'SUPER_ADMIN') {
      setError('Você precisa estar no modo Admin para realizar esta ação.')
      return
    }

    setError('')
    setSuccess('')
    try {
      const res = await apiClient.patch('/tenants', { id, isActive: !isActive })
      if (res.data.status === 'ok') {
        setSuccess('Status atualizado!')
        fetchFamilies()
      } else {
        setError(res.data.message || 'Erro ao atualizar status')
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Você precisa estar no modo Admin para realizar esta ação.')
      } else {
        setError(err.response?.data?.message || 'Erro ao atualizar status')
      }
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Verificar se está no modo admin antes de fazer a requisição
    if (!isAdminMode || userRole !== 'SUPER_ADMIN') {
      setError('Você precisa estar no modo Admin para realizar esta ação.')
      return
    }

    setError('')
    setSuccess('')
    if (!editFamily) return
    try {
      const res = await apiClient.patch('/tenants', editFamily)
      if (res.data.status === 'ok') {
        setSuccess('Família atualizada!')
        setEditFamily(null)
        fetchFamilies()
      } else {
        setError(res.data.message || 'Erro ao atualizar família')
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Você precisa estar no modo Admin para realizar esta ação.')
      } else {
        setError(err.response?.data?.message || 'Erro ao atualizar família')
      }
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }
  
  // Apenas SUPER_ADMIN em modo admin pode acessar
  if (status === 'unauthenticated' || userRole !== 'SUPER_ADMIN' || !isAdminMode) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso negado.</p>
          <p className="text-sm mt-1">Esta página é restrita a Super Admins no modo Admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Famílias
          </h1>
          <p className="text-slate-600 mt-1">Gerencie todas as famílias cadastradas no sistema</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-64 bg-white border border-slate-200/60 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Nome</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Telefone</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Plano</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Usuários</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Criado em</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {families
                  .filter(t => !filter || 
                    t.name.toLowerCase().includes(filter.toLowerCase()) || 
                    t.phoneNumber.includes(filter)
                  )
                  .map(family => (
                    <tr key={family.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{family.name}</td>
                      <td className="px-6 py-4 text-slate-600">{family.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          family.subscriptionPlan === 'premium' 
                            ? 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border border-cyan-200'
                            : family.subscriptionPlan === 'enterprise'
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {planLabels[family.subscriptionPlan] || family.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center ${
                          family.isActive ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            family.isActive ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          <span className="font-medium">{family.isActive ? 'Ativo' : 'Inativo'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {(family as any)._count?.users || 0} usuários
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(family.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setEditFamily(family)}
                            className="p-2 rounded-lg hover:bg-cyan-50 text-cyan-600 transition-colors border border-transparent hover:border-cyan-200"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleStatusChange(family.id, family.isActive)}
                            className={`p-2 rounded-lg transition-colors border ${
                              family.isActive
                                ? 'hover:bg-red-50 text-red-600 border-transparent hover:border-red-200'
                                : 'hover:bg-emerald-50 text-emerald-600 border-transparent hover:border-emerald-200'
                            }`}
                            title={family.isActive ? 'Desativar' : 'Ativar'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={family.isActive 
                                ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              } />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal de edição */}
      {editFamily && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Editar Família
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome</label>
                <input
                  name="name"
                  value={editFamily.name}
                  onChange={e => setEditFamily({ ...editFamily, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                  placeholder="Nome da família"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                <input
                  name="phoneNumber"
                  value={editFamily.phoneNumber}
                  onChange={e => setEditFamily({ ...editFamily, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Plano</label>
                <select
                  name="subscriptionPlan"
                  value={editFamily.subscriptionPlan}
                  onChange={e => setEditFamily({ ...editFamily, subscriptionPlan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="basic">Básico</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setEditFamily(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                Salvar alterações
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                {success}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}