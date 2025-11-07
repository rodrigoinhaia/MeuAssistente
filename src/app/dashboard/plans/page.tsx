"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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
  const [plans, setPlans] = useState<Plan[]>([])
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const res = await fetch('/api/plans')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setPlans(data.plans)
      }
    } catch (err) {
      setError('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !session.user || ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Acesso restrito.
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
      const method = editPlan.id ? 'PATCH' : 'POST'
      const res = await fetch('/api/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editPlan,
          features: editPlan.features.filter(f => f.trim())
        })
      })
      
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(editPlan.id ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!')
        setEditPlan(null)
        fetchPlans()
      }
    } catch (err: any) {
      setError(editPlan.id ? 'Erro ao atualizar plano' : 'Erro ao criar plano')
    }
  }

  async function handleStatusChange(plan: Plan) {
    const action = plan.isActive ? 'desativar' : 'ativar'
    const confirmed = window.confirm(`Tem certeza que deseja ${action} o plano ${plan.name}?`)
    
    if (!confirmed) return
    
    try {
      const res = await fetch('/api/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          isActive: !plan.isActive
        })
      })
      
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`Plano ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`)
        fetchPlans()
      }
    } catch (err: any) {
      setError(`Erro ao ${action} o plano`)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Gestão de Planos
        </h1>
        <button
          onClick={() => setEditPlan({ ...defaultNewPlan })}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
        >
          Novo Plano
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-gray-900/50 backdrop-blur-sm rounded-2xl border ${
              plan.id === 'premium'
                ? 'border-cyan-500/50'
                : plan.id === 'enterprise'
                ? 'border-purple-500/50'
                : 'border-gray-800'
            } overflow-hidden hover:border-opacity-100 transition-colors`}
          >
            {/* Gradiente de fundo */}
            <div
              className={`absolute inset-0 opacity-[0.03] ${
                plan.id === 'premium'
                  ? 'bg-gradient-to-br from-cyan-400 to-emerald-400'
                  : plan.id === 'enterprise'
                  ? 'bg-gradient-to-br from-purple-400 to-pink-400'
                  : ''
              }`}
            />

            {/* Conteúdo */}
            <div className="relative p-6">
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold ${
                  plan.name.toLowerCase().includes('premium')
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                    : plan.name.toLowerCase().includes('enterprise')
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                    : 'text-white'
                } ${!plan.name.toLowerCase().includes('básico') ? 'bg-clip-text text-transparent' : ''}`}>
                  {plan.name}
                </h3>
                <p className="text-gray-300 text-sm mt-2">{plan.description}</p>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${
                    plan.name.toLowerCase().includes('premium')
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                      : plan.name.toLowerCase().includes('enterprise')
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                      : 'text-white'
                  } ${!plan.name.toLowerCase().includes('básico') ? 'bg-clip-text text-transparent' : ''}`}>
                    R$ {Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-gray-300">/mês</span>
                </div>
                <div className="mt-2 flex justify-center gap-4 text-sm">
                  <div className="text-gray-300">
                    <span className="font-medium">{plan.maxUsers}</span> usuários
                  </div>
                  <div className="text-gray-300">
                    <span className="font-medium">{plan.maxStorage}GB</span> armazenamento
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                {plan.features.filter(f => f.trim() !== '').map((feature, index) => (
                  <div key={index} className="flex items-center text-sm group">
                    <svg
                      className={`w-5 h-5 mr-2 ${
                        plan.name.toLowerCase().includes('premium')
                          ? 'text-cyan-400 group-hover:text-emerald-400'
                          : plan.name.toLowerCase().includes('enterprise')
                          ? 'text-purple-400 group-hover:text-pink-400'
                          : 'text-emerald-400'
                      } transition-colors duration-300`}
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
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setEditPlan(plan)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-all duration-300 ${
                    plan.id === 'premium'
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-cyan-500/20 text-white'
                      : plan.id === 'enterprise'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/20 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-200'
                  }`}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleStatusChange(plan)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-300 ${
                    plan.isActive
                      ? 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500'
                      : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500'
                  }`}
                >
                  {plan.isActive ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={handleEditSubmit}
            className="bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800 space-y-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Editar Plano
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                <input
                  name="name"
                  value={editPlan.name}
                  onChange={e => setEditPlan({ ...editPlan, name: e.target.value })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                <textarea
                  name="description"
                  value={editPlan.description}
                  onChange={e => setEditPlan({ ...editPlan, description: e.target.value })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Preço (R$)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPlan.price}
                  onChange={e => setEditPlan({ ...editPlan, price: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Limite de Usuários</label>
                <input
                  name="maxUsers"
                  type="number"
                  min="1"
                  value={editPlan.maxUsers}
                  onChange={e => setEditPlan({ ...editPlan, maxUsers: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Armazenamento (GB)</label>
                <input
                  name="maxStorage"
                  type="number"
                  min="1"
                  value={editPlan.maxStorage}
                  onChange={e => setEditPlan({ ...editPlan, maxStorage: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Recursos</label>
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
                        className="flex-1 bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = [...editPlan.features]
                          newFeatures.splice(index, 1)
                          setEditPlan({ ...editPlan, features: newFeatures })
                        }}
                        className="px-3 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors text-sm"
                  >
                    + Adicionar Recurso
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setEditPlan(null)}
                className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                Salvar alterações
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                {success}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
} 