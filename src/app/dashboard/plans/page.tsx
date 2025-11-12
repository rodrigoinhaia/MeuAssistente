"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  maxUsers: number
  maxStorage: number
  isActive: boolean
}

const defaultNewPlan: Plan = {
  id: '',
  name: '',
  description: '',
  price: 0,
  features: [''],
  maxUsers: 5,
  maxStorage: 1,
  isActive: true,
}

export default function PlansPage() {
  const { data: session, status } = useSession()
  const { isAdminMode, isSuperAdmin } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [plans, setPlans] = useState<Plan[]>([])
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Apenas SUPER_ADMIN em modo admin pode ver esta página
    if (status === 'authenticated') {
      // Verifica diretamente o localStorage para garantir que está atualizado
      const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_context') : null
      const currentContext = (stored === 'admin' || stored === 'family') ? stored : 'family'
      const isInAdminMode = currentContext === 'admin'
      
      if (isSuperAdmin && isInAdminMode) {
        fetchPlans()
      } else {
        setError('Você precisa estar no modo Admin para ver esta página. Altere para o modo Admin no menu lateral.')
        setLoading(false)
      }
    }
  }, [status, isAdminMode, isSuperAdmin])

  async function fetchPlans() {
    try {
      const res = await apiClient.get('/plans')
      if (res.data.error) {
        setError(res.data.error)
      } else {
        setPlans(res.data.plans || [])
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  // Se não estiver no modo admin, mostrar mensagem de erro
  if (error && !isSuperAdmin && !isAdminMode) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso restrito.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!editPlan) return
    
    // Validações
    if (!editPlan.name.trim()) {
      setError('Nome do plano é obrigatório')
      return
    }
    if (!editPlan.description.trim()) {
      setError('Descrição do plano é obrigatória')
      return
    }
    if (editPlan.price <= 0) {
      setError('Preço deve ser maior que zero')
      return
    }
    if (editPlan.maxUsers < 1) {
      setError('Limite de usuários deve ser maior que zero')
      return
    }
    if (editPlan.maxStorage < 1) {
      setError('Armazenamento deve ser maior que zero')
      return
    }
    if (editPlan.features.filter(f => f.trim()).length === 0) {
      setError('Adicione pelo menos um recurso ao plano')
      return
    }
    
    try {
      const method = editPlan.id ? 'patch' : 'post'
      const res = await apiClient[method]('/plans', {
        ...editPlan,
        features: editPlan.features.filter(f => f.trim())
      })
      
      if (res.data.error) {
        setError(res.data.error)
      } else {
        setSuccess(editPlan.id ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!')
        setEditPlan(null)
        fetchPlans()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (editPlan.id ? 'Erro ao atualizar plano' : 'Erro ao criar plano'))
    }
  }

  async function handleStatusChange(plan: Plan) {
    const action = plan.isActive ? 'desativar' : 'ativar'
    const confirmed = window.confirm(`Tem certeza que deseja ${action} o plano ${plan.name}?`)
    
    if (!confirmed) return
    
    try {
      const res = await apiClient.patch('/plans', {
        ...plan,
        isActive: !plan.isActive
      })
      
      if (res.data.error) {
        setError(res.data.error)
      } else {
        setSuccess(`Plano ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`)
        fetchPlans()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Erro ao ${action} o plano`)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Gestão de Planos
          </h1>
          <p className="text-slate-600 mt-1">Gerencie os planos de assinatura disponíveis no sistema</p>
        </div>
        <button
          onClick={() => setEditPlan({ ...defaultNewPlan })}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
        >
          + Novo Plano
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPremium = plan.name.toLowerCase().includes('premium')
          const isEnterprise = plan.name.toLowerCase().includes('enterprise')
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white border rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all ${
                isPremium
                  ? 'border-cyan-200/60'
                  : isEnterprise
                  ? 'border-purple-200/60'
                  : 'border-slate-200/60'
              }`}
            >
              {/* Badge de destaque */}
              {isPremium && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  Popular
                </div>
              )}
              {isEnterprise && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  Premium
                </div>
              )}

              {/* Header com gradiente */}
              <div className={`p-6 ${
                isPremium
                  ? 'bg-gradient-to-r from-cyan-50 to-emerald-50'
                  : isEnterprise
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50'
                  : 'bg-gradient-to-r from-slate-50 to-slate-100'
              }`}>
                <h3 className={`text-2xl font-bold mb-2 ${
                  isPremium
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent'
                    : isEnterprise
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'
                    : 'text-slate-800'
                }`}>
                  {plan.name}
                </h3>
                <p className="text-slate-600 text-sm">{plan.description}</p>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${
                      isPremium
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent'
                        : isEnterprise
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'
                        : 'text-slate-800'
                    }`}>
                      R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-500 text-sm">/mês</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">{plan.maxUsers}</span> usuários
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <span className="font-medium">{plan.maxStorage}GB</span>
                  </div>
                </div>
              </div>
              
              {/* Features */}
              <div className="p-6 space-y-3">
                <div className="text-sm font-semibold text-slate-700 mb-4">Recursos incluídos:</div>
                {plan.features.filter(f => f.trim() !== '').map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        isPremium
                          ? 'text-cyan-500'
                          : isEnterprise
                          ? 'text-purple-500'
                          : 'text-emerald-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700 text-sm flex-1">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Footer com ações */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setEditPlan(plan)}
                  className={`flex-1 py-2.5 px-4 rounded-xl transition-all font-medium ${
                    isPremium
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-cyan-500/30'
                      : isEnterprise
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleStatusChange(plan)}
                  className={`px-4 py-2.5 rounded-xl border transition-all font-medium ${
                    plan.isActive
                      ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  {plan.isActive ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              {/* Status badge */}
              <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-semibold ${
                plan.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {plan.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de edição */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {editPlan.id ? 'Editar Plano' : 'Novo Plano'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome</label>
                <input
                  name="name"
                  value={editPlan.name}
                  onChange={e => setEditPlan({ ...editPlan, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Ex: Básico, Premium, Enterprise"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <textarea
                  name="description"
                  value={editPlan.description}
                  onChange={e => setEditPlan({ ...editPlan, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                  rows={3}
                  placeholder="Descreva os benefícios do plano"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Preço (R$)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPlan.price}
                  onChange={e => setEditPlan({ ...editPlan, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Limite de Usuários</label>
                  <input
                    name="maxUsers"
                    type="number"
                    min="1"
                    value={editPlan.maxUsers}
                    onChange={e => setEditPlan({ ...editPlan, maxUsers: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Armazenamento (GB)</label>
                  <input
                    name="maxStorage"
                    type="number"
                    min="1"
                    value={editPlan.maxStorage}
                    onChange={e => setEditPlan({ ...editPlan, maxStorage: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Recursos</label>
                <div className="space-y-2">
                  {editPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={feature}
                        onChange={e => {
                          const newFeatures = [...editPlan.features]
                          newFeatures[index] = e.target.value
                          setEditPlan({ ...editPlan, features: newFeatures })
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                        placeholder="Ex: Suporte 24/7, API ilimitada"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = [...editPlan.features]
                          newFeatures.splice(index, 1)
                          setEditPlan({ ...editPlan, features: newFeatures })
                        }}
                        className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditPlan({ 
                      ...editPlan, 
                      features: [...editPlan.features, ''] 
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-medium"
                  >
                    + Adicionar Recurso
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditPlan(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                {editPlan.id ? 'Salvar alterações' : 'Criar plano'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                {success}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
} 