'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

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
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editFamily, setEditFamily] = useState<Family | null>(null)
  const [filter, setFilter] = useState('')

  async function fetchFamilies() {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/tenants')
      setFamilies(res.data.families)
    } catch (err: any) {
      setError('Erro ao carregar clientes')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'SUPER_ADMIN') {
        fetchFamilies()
    }
  }, [status, session])


  async function handleStatusChange(id: string, isActive: boolean) {
    setError('')
    setSuccess('')
    try {
      const res = await axios.patch('/api/tenants', { id, isActive: !isActive })
      if (res.data.status === 'ok') {
        setSuccess('Status atualizado!')
        fetchFamilies()
      } else {
        setError(res.data.message || 'Erro ao atualizar status')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!editFamily) return
    try {
      const res = await axios.patch('/api/tenants', editFamily)
      if (res.data.status === 'ok') {
        setSuccess('Cliente atualizado!')
        setEditFamily(null)
        fetchFamilies()
      } else {
        setError(res.data.message || 'Erro ao atualizar cliente')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar cliente')
    }
  }

  if (status === 'loading') return <div className="p-8">Carregando sessão...</div>
  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'SUPER_ADMIN') {
      return <div className="p-8 text-red-500">Acesso negado. Esta página é restrita a Super Admins.</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Clientes
        </h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-64 bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
      {success && <div className="text-emerald-400 mb-4">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="px-6 py-4 text-left font-medium">Nome</th>
                  <th className="px-6 py-4 text-left font-medium">Telefone</th>
                  <th className="px-6 py-4 text-left font-medium">Plano</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Criado em</th>
                  <th className="px-6 py-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {families
                  .filter(t => !filter || 
                    t.name.toLowerCase().includes(filter.toLowerCase()) || 
                    t.phoneNumber.includes(filter)
                  )
                  .map(family => (
                    <tr key={family.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{family.name}</td>
                      <td className="px-6 py-4">{family.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          family.subscriptionPlan === 'premium' 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400'
                            : family.subscriptionPlan === 'enterprise'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {planLabels[family.subscriptionPlan] || family.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center ${
                          family.isActive ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            family.isActive ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          {family.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(family.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setEditFamily(family)}
                            className="p-2 rounded-lg hover:bg-white/5 text-cyan-400 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-2a2 2 0 012-2h2a2 2 0 012 2v2h6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleStatusChange(family.id, family.isActive)}
                            className="p-2 rounded-lg hover:bg-white/5 text-red-400 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm0 0V3m0 2v2" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={handleEditSubmit}
            className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800 space-y-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Editar Cliente
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                <input
                  name="name"
                  value={editFamily.name}
                  onChange={e => setEditFamily({ ...editFamily, name: e.target.value })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                  placeholder="Nome da família/cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                <input
                  name="phoneNumber"
                  value={editFamily.phoneNumber}
                  onChange={e => setEditFamily({ ...editFamily, phoneNumber: e.target.value })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                  required
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Plano</label>
                <select
                  name="subscriptionPlan"
                  value={editFamily.subscriptionPlan}
                  onChange={e => setEditFamily({ ...editFamily, subscriptionPlan: e.target.value })}
                  className="w-full bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
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
                className="px-4 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 transition-colors"
              >
                Salvar alterações
              </button>
            </div>

            {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
            {success && <div className="mt-4 text-emerald-400 text-sm">{success}</div>}
          </form>
        </div>
      )}
    </div>
  )
}