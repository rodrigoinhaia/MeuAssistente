"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'

interface Family {
  id: string
  name: string
  phoneNumber: string
  subscriptionPlan: string
  isActive: boolean
  createdAt: string
}
interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}
interface Usage {
  transactions: number
  tasks: number
  commitments: number
  integrations: number
}
interface Subscription {
  id: string
  planId: string
  status: string
  startDate: string
  endDate?: string
}
interface AuditLog {
  id: string
  action: string
  user: string
  date: string
  details?: string
}

const planLabels: Record<string, string> = {
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

export default function FamilyDetailsPage() {
  const { data: session, status } = useSession()
  const { isAdminMode, isSuperAdmin } = useAdminContext()
  const router = useRouter()
  const params = useParams()
  const familyId = params.id as string
  const userRole = (session?.user as any)?.role

  const [family, setFamily] = useState<Family | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Apenas SUPER_ADMIN em modo admin pode ver detalhes de outras famílias
    if (status === 'authenticated' && familyId) {
      if (isSuperAdmin && isAdminMode) {
        fetchAll()
      } else {
        setError('Você precisa estar no modo Admin para ver esta página. Altere para o modo Admin no menu lateral.')
        setLoading(false)
      }
    }
  }, [status, familyId, isAdminMode, isSuperAdmin])

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        apiClient.get(`/tenants/${familyId}`),
        apiClient.get(`/tenants/${familyId}/users`),
        apiClient.get(`/tenants/${familyId}/usage`),
        apiClient.get(`/tenants/${familyId}/subscriptions`),
        apiClient.get(`/tenants/${familyId}/logs`),
      ])

      const familyRes = results[0].status === 'fulfilled' ? results[0].value : null
      const usersRes = results[1].status === 'fulfilled' ? results[1].value : null
      const usageRes = results[2].status === 'fulfilled' ? results[2].value : null
      const subsRes = results[3].status === 'fulfilled' ? results[3].value : null
      const logsRes = results[4].status === 'fulfilled' ? results[4].value : null

      if (familyRes?.data?.status === 'ok') {
        setFamily(familyRes.data.family)
      } else {
        setError(familyRes?.data?.message || 'Erro ao carregar dados da família')
      }

      if (usersRes?.data?.status === 'ok') {
        setUsers(usersRes.data.users || [])
      }

      if (usageRes?.data?.status === 'ok') {
        setUsage(usageRes.data.usage || null)
      }

      if (subsRes?.data?.status === 'ok') {
        setSubscriptions(subsRes.data.subscriptions || [])
      }

      if (logsRes?.data?.status === 'ok') {
        setLogs(logsRes.data.logs || [])
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao carregar dados da família')
    }
    setLoading(false)
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session) return <div>Você precisa estar autenticado.</div>

  if (loading) return <div>Carregando dados da família...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!family) return <div>Família não encontrada.</div>

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Detalhes da Empresa (Família)</h1>
      <section className="mb-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-2">Dados Cadastrais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><strong>Nome:</strong> {family.name}</div>
          <div><strong>Telefone:</strong> {family.phoneNumber}</div>
          <div><strong>Plano:</strong> {planLabels[family.subscriptionPlan] || family.subscriptionPlan}</div>
          <div><strong>Status:</strong> {family.isActive ? <span className="text-green-600 font-semibold">Ativo</span> : <span className="text-red-600 font-semibold">Inativo</span>}</div>
          <div><strong>Criado em:</strong> {new Date(family.createdAt).toLocaleDateString()}</div>
        </div>
      </section>
      <section className="mb-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-2">Usuários</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">E-mail</th>
              <th className="p-2 text-left">Papel</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.isActive ? <span className="text-green-600 font-semibold">Ativo</span> : <span className="text-red-600 font-semibold">Inativo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-2">Resumo de Uso</h2>
        {usage ? (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <li><strong>Transações:</strong> {usage.transactions}</li>
            <li><strong>Tarefas:</strong> {usage.tasks}</li>
            <li><strong>Compromissos:</strong> {usage.commitments}</li>
            <li><strong>Integrações:</strong> {usage.integrations}</li>
          </ul>
        ) : <div>Nenhum dado de uso.</div>}
      </section>
      <section className="mb-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-2">Histórico de Assinaturas</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Plano</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Início</th>
              <th className="p-2 text-left">Fim</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{planLabels[s.planId] || s.planId}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2">{new Date(s.startDate).toLocaleDateString()}</td>
                <td className="p-2">{s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-2">Logs de Auditoria</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Usuário</th>
              <th className="p-2 text-left">Ação</th>
              <th className="p-2 text-left">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-2">{new Date(l.date).toLocaleString()}</td>
                <td className="p-2">{l.user}</td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">{l.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}