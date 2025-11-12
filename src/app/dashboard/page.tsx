"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'
import Link from 'next/link'
import FinancialChart from './components/FinancialChart'
import { CashFlowChart } from './components/FinancialChart'

interface DashboardData {
  transactions: {
    total: number
    income: number
    expense: number
  }
  commitments: {
    today: number
    upcoming: number
  }
  tasks: {
    pending: number
    overdue: number
  }
  integrations: {
    google: boolean
  }
  stats?: {
    receiveToday: number
    receiveRemaining: number
    payToday: number
    payRemaining: number
    overdueIncome: number
    overdueExpense: number
    totalIncome: number
    totalExpense: number
    balance: number
  }
}

interface Transaction {
  id: string
  amount: string
  type: string
  date: string
  category?: {
    name: string
    color: string
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { isAdminMode, isSuperAdmin } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [data, setData] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      if (isSuperAdmin && isAdminMode) {
        fetchAdminDashboardData()
      } else {
        fetchDashboardData()
      }
    }
  }, [status, isAdminMode, isSuperAdmin])

  async function fetchAdminDashboardData() {
    setLoading(true)
    setError('')
    try {
      // Buscar dados agregados para modo admin
      const results = await Promise.allSettled([
        apiClient.get('/reports'),
        apiClient.get('/tenants'),
        apiClient.get('/subscriptions'),
        apiClient.get('/payments'),
      ])

      const reportsRes = results[0].status === 'fulfilled' ? results[0].value : null
      const tenantsRes = results[1].status === 'fulfilled' ? results[1].value : null
      const subscriptionsRes = results[2].status === 'fulfilled' ? results[2].value : null
      const paymentsRes = results[3].status === 'fulfilled' ? results[3].value : null

      if (reportsRes?.data?.status === 'ok') {
        setAdminData({
          reportData: reportsRes.data.reportData,
          monthlyRevenue: reportsRes.data.monthlyRevenue || [],
          tenants: tenantsRes?.data?.status === 'ok' ? tenantsRes.data.families || [] : [],
          subscriptions: subscriptionsRes?.data?.subscriptions || [],
          payments: paymentsRes?.data || [],
        })
      } else {
        setError('Erro ao carregar dados do dashboard admin')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao carregar dados do dashboard admin')
    }
    setLoading(false)
  }

  async function fetchDashboardData() {
    setLoading(true)
    setError('')
    try {
      // Buscar dados de diferentes APIs - tratar cada uma individualmente
      const results = await Promise.allSettled([
        apiClient.get('/transactions'),
        apiClient.get('/commitments'),
        apiClient.get('/tasks'),
        apiClient.get('/integrations'),
        apiClient.get('/dashboard/stats'),
      ])

      // Processar resultados - se uma falhar, usar valores padrão
      const transactionsRes = results[0].status === 'fulfilled' ? results[0].value : null
      const commitmentsRes = results[1].status === 'fulfilled' ? results[1].value : null
      const tasksRes = results[2].status === 'fulfilled' ? results[2].value : null
      const integrationsRes = results[3].status === 'fulfilled' ? results[3].value : null
      const statsRes = results[4].status === 'fulfilled' ? results[4].value : null

      // Log de erros individuais com detalhes
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['transactions', 'commitments', 'tasks', 'integrations', 'stats']
          const error = result.reason
          console.error(`[DASHBOARD] Erro ao buscar ${apiNames[index]}:`, {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            url: error?.config?.url,
          })
        }
      })

      const transactionsData = transactionsRes?.data?.status === 'ok' ? transactionsRes.data.transactions || [] : []
      const commitments = commitmentsRes?.data?.status === 'ok' ? commitmentsRes.data.commitments || [] : []
      const tasks = tasksRes?.data?.status === 'ok' ? tasksRes.data.tasks || [] : []
      const integrations = integrationsRes?.data?.status === 'ok' ? integrationsRes.data.integrations || [] : []
      const stats = statsRes?.data?.status === 'ok' ? statsRes.data.stats || {
        receiveToday: 0,
        receiveRemaining: 0,
        payToday: 0,
        payRemaining: 0,
        overdueIncome: 0,
        overdueExpense: 0,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      } : {
        receiveToday: 0,
        receiveRemaining: 0,
        payToday: 0,
        payRemaining: 0,
        overdueIncome: 0,
        overdueExpense: 0,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      }

      setTransactions(transactionsData)

      // Calcular métricas (amount pode ser string ou number)
      const totalIncome = transactionsData
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0)

      const totalExpense = transactionsData
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0)

      const today = new Date().toISOString().split('T')[0]
      const commitmentsToday = commitments.filter((c: any) => c.date.startsWith(today))
      const commitmentsUpcoming = commitments.filter((c: any) => c.date > today)

      const tasksPending = tasks.filter((t: any) => t.status === 'pending')
      const tasksOverdue = tasks.filter((t: any) => 
        new Date(t.dueDate) < new Date() && t.status !== 'completed'
      )

      const googleIntegration = integrations.find((i: any) => i.provider === 'google')

      setData({
        transactions: {
          total: transactionsData.length,
          income: totalIncome,
          expense: totalExpense,
        },
        commitments: {
          today: commitmentsToday.length,
          upcoming: commitmentsUpcoming.length,
        },
        tasks: {
          pending: tasksPending.length,
          overdue: tasksOverdue.length,
        },
        integrations: {
          google: !!googleIntegration,
        },
        stats, // Adicionar stats para uso nos cards
      })

      // Verificar se alguma API falhou e mostrar aviso
      const failedApis = results
        .map((result, index) => {
          if (result.status === 'rejected') {
            const apiNames = ['Transações', 'Compromissos', 'Tarefas', 'Integrações', 'Estatísticas']
            return apiNames[index]
          }
          return null
        })
        .filter((name): name is string => name !== null)

      if (failedApis.length > 0) {
        const errorDetails = results
          .map((result, index) => {
            if (result.status === 'rejected') {
              const apiNames = ['Transações', 'Compromissos', 'Tarefas', 'Integrações', 'Estatísticas']
              const error = result.reason
              const status = error?.response?.status
              const message = error?.response?.data?.message || error?.message || 'Erro desconhecido'
              return `${apiNames[index]} (${status || 'N/A'}): ${message}`
            }
            return null
          })
          .filter(Boolean)
          .join('; ')

        setError(`Alguns dados não puderam ser carregados: ${failedApis.join(', ')}. ${errorDetails}`)
      } else {
        setError('') // Limpar erro se tudo funcionou
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro desconhecido'
      setError(`Erro ao carregar dados do dashboard: ${errorMessage}. Tente atualizar a página.`)
      console.error('[DASHBOARD] Erro completo:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        stack: err?.stack,
      })
    }
    setLoading(false)
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session) return <div>Você precisa estar autenticado.</div>

  // Renderizar dashboard admin se estiver no modo admin
  if (isSuperAdmin && isAdminMode) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              Dashboard Admin
            </h1>
            <p className="text-slate-600 mt-1">Visão geral do sistema e métricas de negócio</p>
          </div>
          <button
            onClick={fetchAdminDashboardData}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
          >
            Atualizar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin shadow-lg" />
          </div>
        ) : adminData ? (
          <>
            {/* Métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
                <div className="text-slate-600 text-sm font-semibold mb-2">Receita Total</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  R$ {adminData.reportData?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
                <div className="text-slate-600 text-sm font-semibold mb-2">Assinaturas Ativas</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  {adminData.reportData?.activeSubscriptions || 0}
                </div>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
                <div className="text-slate-600 text-sm font-semibold mb-2">Total de Famílias</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  {adminData.reportData?.totalfamilys || adminData.tenants?.length || 0}
                </div>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
                <div className="text-slate-600 text-sm font-semibold mb-2">Total de Usuários</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  {adminData.reportData?.totalUsers || 0}
                </div>
              </div>
            </div>

            {/* Gráfico de Receita Mensal */}
            {adminData.monthlyRevenue && adminData.monthlyRevenue.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 mb-8 shadow-md">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Receita Mensal (Últimos 6 meses)</h3>
                <div className="h-[300px]">
                  {/* Aqui pode adicionar um gráfico de linha com os dados de monthlyRevenue */}
                  <div className="flex items-center justify-center h-full text-slate-500">
                    Gráfico de receita mensal (implementar com recharts)
                  </div>
                </div>
              </div>
            )}

            {/* Resumo rápido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Famílias Recentes</h3>
                <div className="space-y-2">
                  {adminData.tenants?.slice(0, 5).map((tenant: any) => (
                    <div key={tenant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                      <span className="text-slate-700">{tenant.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${tenant.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {tenant.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  ))}
                  {(!adminData.tenants || adminData.tenants.length === 0) && (
                    <p className="text-slate-500 text-sm">Nenhuma família encontrada</p>
                  )}
                </div>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Assinaturas Recentes</h3>
                <div className="space-y-2">
                  {adminData.subscriptions?.slice(0, 5).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                      <div>
                        <span className="text-slate-700 font-medium">{sub.familyName}</span>
                        <span className="text-slate-500 text-sm ml-2">- {sub.planName}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                  {(!adminData.subscriptions || adminData.subscriptions.length === 0) && (
                    <p className="text-slate-500 text-sm">Nenhuma assinatura encontrada</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    )
  }

  // Dashboard normal (modo família)
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Bem-vindo ao seu painel de controle</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      ) : data ? (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Receber Hoje */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
              <div>
                <div className="text-slate-600 text-sm font-semibold mb-2">A Receber Hoje</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mb-3">
                  R$ {data.stats?.receiveToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
                <div className="text-sm text-slate-500">
                  Restante do mês: <span className="font-semibold text-slate-700">
                    R$ {data.stats?.receiveRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-medium">
                Novo Recebimento
              </button>
            </div>

            {/* Pagar Hoje */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
              <div>
                <div className="text-slate-600 text-sm font-semibold mb-2">A Pagar Hoje</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-3">
                  R$ {data.stats?.payToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
                <div className="text-sm text-slate-500">
                  Restante do mês: <span className="font-semibold text-slate-700">
                    R$ {data.stats?.payRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all font-medium">
                Novo Pagamento
              </button>
            </div>

            {/* Recebimentos em Atraso */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                  <span className="text-emerald-600 text-xl">⬇️</span>
                </div>
                <div className="text-slate-600 text-sm font-semibold">Recebimentos em Atraso</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                R$ {data.stats?.overdueIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>

            {/* Pagamentos em Atraso */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-pink-100">
                  <span className="text-red-600 text-xl">⬆️</span>
                </div>
                <div className="text-slate-600 text-sm font-semibold">Pagamentos em Atraso</div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                R$ {data.stats?.overdueExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-xl transition-all">
              <div className="text-slate-600 text-sm font-semibold mb-2">Receitas</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                R$ {data.stats?.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-xl transition-all">
              <div className="text-slate-600 text-sm font-semibold mb-2">Despesas</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                R$ {data.stats?.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-xl transition-all">
              <div className="text-slate-600 text-sm font-semibold mb-2">Saldo</div>
              <div className={`text-3xl font-bold bg-clip-text text-transparent ${
                (data.stats?.balance || 0) >= 0 
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                {data.stats && data.stats.balance < 0 ? '-' : ''}R$ {Math.abs(data.stats?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Gráfico de Fluxo de Caixa */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 mb-8 shadow-md">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Fluxo de Caixa Completo</h3>
            <div className="h-[300px]">
              <CashFlowChart transactions={transactions} />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <span className="inline-flex items-center text-slate-700">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mr-2"></span>
                Recebimentos
              </span>
              <span className="inline-flex items-center text-slate-700">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mr-2"></span>
                Pagamentos
              </span>
              <span className="inline-flex items-center text-slate-700">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 mr-2"></span>
                Saldo
              </span>
            </div>
          </div>

          {/* Gráficos detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Despesas por Categoria */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Despesas por Categoria</h3>
              <FinancialChart transactions={transactions} onlyPie />
            </div>

            {/* Fluxo de Receitas vs Despesas */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Receitas vs Despesas</h3>
              <FinancialChart transactions={transactions} onlyLine />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
} 