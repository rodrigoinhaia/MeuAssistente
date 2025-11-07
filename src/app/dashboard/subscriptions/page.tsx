"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'

interface Plan {
  id: string
  name: string
  price: string | number
  maxUsers: number
  maxStorage: number
  isActive?: boolean
}

interface Family {
  id: string
  name: string
}

interface Subscription {
  id: string
  familyId: string
  familyName: string
  planId: string
  planName: string
  status: string
  startDate: string
  endDate?: string | null
  price: string | number
  asaasSubscriptionId?: string | null
}

interface EditingSubscription {
  id?: string
  familyId?: string
  familyName?: string
  planId?: string
  planName?: string
  status?: string
  startDate?: string
  endDate?: string | null
  price?: string | number
  asaasSubscriptionId?: string | null
}

const planLabels: Record<string, string> = {
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  cancelled: 'Cancelada',
  trial: 'Trial',
  expired: 'Expirada',
}

const statusColors: Record<string, string> = {
  active: 'text-emerald-600',
  inactive: 'text-slate-600',
  cancelled: 'text-red-600',
  trial: 'text-blue-600',
  expired: 'text-orange-600',
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const { isAdminMode } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [editSubscription, setEditSubscription] = useState<EditingSubscription | null>(null)

  useEffect(() => {
    // OWNER ou SUPER_ADMIN em modo admin podem ver assinaturas
    if (status === 'authenticated' && (userRole === 'OWNER' || (userRole === 'SUPER_ADMIN' && isAdminMode))) {
      fetchSubscriptions()
      fetchPlans()
      if (userRole === 'SUPER_ADMIN' && isAdminMode) {
        fetchFamilies()
      }
    }
  }, [status, session, userRole, isAdminMode])

  async function fetchSubscriptions() {
    try {
      const res = await apiClient.get('/subscriptions')
      const data = res.data
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSubscriptions(data.subscriptions || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar assinaturas')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlans() {
    try {
      const res = await apiClient.get('/plans')
      const data = res.data
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setPlans((data.plans || []).filter((p: Plan) => p.isActive))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar planos')
    }
  }

  async function fetchFamilies() {
    try {
      const res = await apiClient.get('/tenants')
      const data = res.data
      
      if (data.status === 'ok') {
        setFamilies(data.families || [])
      } else {
        throw new Error(data.message || 'Erro ao carregar famílias')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar famílias')
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setError('')
    setSuccess('')

    const statusMap = {
      active: 'ativar',
      cancelled: 'cancelar',
      inactive: 'inativar',
    }

    const confirmed = window.confirm(`Tem certeza que deseja ${statusMap[newStatus as keyof typeof statusMap]} esta assinatura?`)
    if (!confirmed) return

    try {
      const res = await apiClient.patch('/subscriptions', { id, status: newStatus })
      const data = res.data
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSuccess(`Assinatura ${statusMap[newStatus as keyof typeof statusMap]}da com sucesso!`)
      fetchSubscriptions()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao atualizar status')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!editSubscription) return

    try {
      const method = editSubscription.id ? 'put' : 'post'
      const res = await apiClient[method]('/subscriptions', editSubscription)
      const data = res.data
      
      if (data.error) {
        throw new Error(data.error)
      }

      setSuccess(editSubscription.id ? 'Assinatura atualizada com sucesso!' : 'Assinatura criada com sucesso!')
      setEditSubscription(null)
      fetchSubscriptions()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao salvar assinatura')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  // OWNER ou SUPER_ADMIN em modo admin podem ver assinaturas
  if (!session || !session.user || (userRole !== 'OWNER' && (userRole !== 'SUPER_ADMIN' || !isAdminMode))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200/60 text-center">
          <p className="text-xl font-semibold text-slate-800">Acesso restrito.</p>
          <p className="text-sm text-slate-600 mt-2">Apenas Owners ou Super Admins no modo Admin podem ver assinaturas.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Gestão de Assinaturas
          </h1>
          <p className="text-slate-600 mt-1">Gerencie assinaturas e planos das famílias</p>
        </div>
        {(userRole === 'SUPER_ADMIN' && isAdminMode) && (
          <button
            onClick={() => setEditSubscription({})}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
          >
            Nova Assinatura
          </button>
        )}
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <input
          className="bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
          placeholder="Buscar por empresa ou plano"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select
          className="bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          title="Filtrar por status"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelada</option>
          <option value="expired">Expirada</option>
        </select>
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
        <div className="flex items-center justify-center py-8">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <th className="p-4 text-left font-semibold text-slate-700">Família</th>
                <th className="p-4 text-left font-semibold text-slate-700">Plano</th>
                <th className="p-4 text-left font-semibold text-slate-700">Status</th>
                <th className="p-4 text-left font-semibold text-slate-700">Início</th>
                <th className="p-4 text-left font-semibold text-slate-700">Fim</th>
                <th className="p-4 text-left font-semibold text-slate-700">Valor</th>
                <th className="p-4 text-left font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions
                .filter(s => !filter || 
                  s.familyName.toLowerCase().includes(filter.toLowerCase()) ||
                  s.planName.toLowerCase().includes(filter.toLowerCase()) ||
                  s.status === filter
                )
                .map(subscription => (
                  <tr 
                    key={subscription.id} 
                    className="border-b border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{subscription.familyName}</div>
                      {subscription.asaasSubscriptionId && (
                        <div className="text-xs text-slate-500">ID Asaas: {subscription.asaasSubscriptionId}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{subscription.planName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        subscription.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : subscription.status === 'trial'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : subscription.status === 'cancelled'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : subscription.status === 'expired'
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {statusLabels[subscription.status]}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{new Date(subscription.startDate).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(subscription.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {subscription.endDate ? (
                        <>
                          <div>{new Date(subscription.endDate).toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(subscription.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">R$ {Number(subscription.price).toFixed(2)}</div>
                      <div className="text-xs text-slate-500">/mês</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {subscription.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(subscription.id, 'active')}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-transparent hover:border-emerald-200 transition-colors"
                            title="Ativar assinatura"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {subscription.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(subscription.id, 'cancelled')}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 transition-colors"
                            title="Cancelar assinatura"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setEditSubscription(subscription)}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                          title="Editar assinatura"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edição */}
      {editSubscription !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {editSubscription.id ? 'Editar Assinatura' : 'Nova Assinatura'}
            </h2>
            
            <div className="space-y-4">
              {(userRole === 'SUPER_ADMIN' && isAdminMode) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Família</label>
                  <select
                    value={editSubscription.familyId || ''}
                    onChange={e => {
                      const family = families.find(t => t.id === e.target.value)
                      setEditSubscription({
                        ...editSubscription,
                        familyId: e.target.value,
                        familyName: family?.name
                      })
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  >
                    <option value="" className="text-slate-400">Selecione uma família</option>
                    {families.map(family => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Plano</label>
                <select
                  value={editSubscription.planId || ''}
                  onChange={e => {
                    const plan = plans.find(p => p.id === e.target.value)
                    setEditSubscription({
                      ...editSubscription,
                      planId: e.target.value,
                      planName: plan?.name,
                      price: plan?.price
                    })
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                >
                  <option value="" className="text-slate-400">Selecione um plano</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {Number(plan.price).toFixed(2)}/mês
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={editSubscription.status || 'active'}
                  onChange={e => setEditSubscription({ ...editSubscription, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                >
                  <option value="active">Ativa</option>
                  <option value="trial">Trial</option>
                  <option value="inactive">Inativa</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="expired">Expirada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Início</label>
                <input
                  type="datetime-local"
                  value={editSubscription.startDate || new Date().toISOString().slice(0, 16)}
                  onChange={e => setEditSubscription({ ...editSubscription, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Término</label>
                <input
                  type="datetime-local"
                  value={editSubscription.endDate || ''}
                  onChange={e => setEditSubscription({ ...editSubscription, endDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <p className="mt-1 text-xs text-slate-500">Opcional. Deixe em branco para assinaturas sem data de término.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ID Asaas</label>
                <input
                  type="text"
                  value={editSubscription.asaasSubscriptionId || ''}
                  onChange={e => setEditSubscription({ ...editSubscription, asaasSubscriptionId: e.target.value })}
                  placeholder="ID da assinatura no Asaas"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <p className="mt-1 text-xs text-slate-500">Opcional. ID da assinatura no Asaas para integração.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setEditSubscription(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                {editSubscription.id ? 'Salvar alterações' : 'Criar assinatura'}
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
    </main>
  )
}