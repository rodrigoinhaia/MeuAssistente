"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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
  active: 'text-emerald-600 dark:text-emerald-400',
  inactive: 'text-gray-600 dark:text-gray-400',
  cancelled: 'text-red-600 dark:text-red-400',
  trial: 'text-blue-600 dark:text-blue-400',
  expired: 'text-orange-600 dark:text-orange-400',
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [editSubscription, setEditSubscription] = useState<EditingSubscription | null>(null)

  useEffect(() => {
    fetchSubscriptions()
    fetchPlans()
    fetchFamilies()
  }, [])

  async function fetchSubscriptions() {
    try {
      const res = await fetch('/api/subscriptions')
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSubscriptions(data.subscriptions)
    } catch (err: any) {
      setError('Erro ao carregar assinaturas')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlans() {
    try {
      const res = await fetch('/api/plans')
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setPlans(data.plans.filter((p: Plan) => p.isActive))
    } catch (err: any) {
      setError('Erro ao carregar planos')
    }
  }

  async function fetchFamilies() {
    try {
      const res = await fetch('/api/tenants')
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setFamilies(data.families)
    } catch (err: any) {
      setError('Erro ao carregar empresas')
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
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      
      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSuccess(`Assinatura ${statusMap[newStatus as keyof typeof statusMap]}da com sucesso!`)
      fetchSubscriptions()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!editSubscription) return

    try {
      const url = '/api/subscriptions'
      const method = editSubscription.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubscription)
      })

      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setSuccess(editSubscription.id ? 'Assinatura atualizada com sucesso!' : 'Assinatura criada com sucesso!')
      setEditSubscription(null)
      fetchSubscriptions()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar assinatura')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !session.user || ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Acesso restrito</div>
      </div>
    )
  }

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Gestão de Assinaturas
        </h1>
        <button
          onClick={() => setEditSubscription({})}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
        >
          Nova Assinatura
        </button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <input
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
          placeholder="Buscar por empresa ou plano"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-400 transition-colors [&>*]:bg-gray-900"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          title="Filtrar por status"
          style={{ backgroundColor: '#111827' }}
        >
          <option value="">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelada</option>
          <option value="expired">Expirada</option>
        </select>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
      {success && <div className="text-emerald-400 mb-4">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Início</th>
                <th className="p-4 text-left">Fim</th>
                <th className="p-4 text-left">Valor</th>
                <th className="p-4 text-left">Ações</th>
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
                    className="border-b border-gray-800/50 text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-white">{subscription.familyName}</div>
                      {subscription.asaasSubscriptionId && (
                        <div className="text-xs text-gray-500">ID Asaas: {subscription.asaasSubscriptionId}</div>
                      )}
                    </td>
                    <td className="p-4">{subscription.planName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'active'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : subscription.status === 'trial'
                          ? 'bg-blue-400/10 text-blue-400'
                          : subscription.status === 'cancelled'
                          ? 'bg-red-400/10 text-red-400'
                          : subscription.status === 'expired'
                          ? 'bg-orange-400/10 text-orange-400'
                          : 'bg-gray-400/10 text-gray-400'
                      }`}>
                        {statusLabels[subscription.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>{new Date(subscription.startDate).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(subscription.startDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      {subscription.endDate ? (
                        <>
                          <div>{new Date(subscription.endDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(subscription.endDate).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">R$ {Number(subscription.price).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">/mês</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {subscription.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(subscription.id, 'active')}
                            className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
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
                            className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                            title="Cancelar assinatura"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setEditSubscription(subscription)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                          title="Editar assinatura"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800 space-y-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {editSubscription.id ? 'Editar Assinatura' : 'Nova Assinatura'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Empresa</label>
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
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all [&>*]:bg-gray-900"
                  style={{ backgroundColor: '#111827' }}
                  required
                >
                  <option value="" className="text-gray-400">Selecione uma empresa</option>
                  {families.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Plano</label>
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
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all [&>*]:bg-gray-900"
                  style={{ backgroundColor: '#111827' }}
                  required
                >
                  <option value="" className="text-gray-400">Selecione um plano</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {Number(plan.price).toFixed(2)}/mês
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                <select
                  value={editSubscription.status || 'active'}
                  onChange={e => setEditSubscription({ ...editSubscription, status: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all [&>*]:bg-gray-900"
                  style={{ backgroundColor: '#111827' }}
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
                <label className="block text-sm font-medium text-gray-400 mb-2">Data de Início</label>
                <input
                  type="datetime-local"
                  value={editSubscription.startDate || new Date().toISOString().slice(0, 16)}
                  onChange={e => setEditSubscription({ ...editSubscription, startDate: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Data de Término</label>
                <input
                  type="datetime-local"
                  value={editSubscription.endDate || ''}
                  onChange={e => setEditSubscription({ ...editSubscription, endDate: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">Opcional. Deixe em branco para assinaturas sem data de término.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">ID Asaas</label>
                <input
                  type="text"
                  value={editSubscription.asaasSubscriptionId || ''}
                  onChange={e => setEditSubscription({ ...editSubscription, asaasSubscriptionId: e.target.value })}
                  placeholder="ID da assinatura no Asaas"
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">Opcional. ID da assinatura no Asaas para integração.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setEditSubscription(null)}
                className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                {editSubscription.id ? 'Salvar alterações' : 'Criar assinatura'}
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
    </main>
  )
}