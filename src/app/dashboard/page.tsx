"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
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
  const [data, setData] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    setError('')
    try {
      // Buscar dados de diferentes APIs
      const [transactionsRes, commitmentsRes, tasksRes, integrationsRes, statsRes] = await Promise.all([
        apiClient.get('/transactions'),
        apiClient.get('/commitments'),
        apiClient.get('/tasks'),
        apiClient.get('/integrations'),
        apiClient.get('/dashboard/stats'),
      ])

      const transactionsData = transactionsRes.data.status === 'ok' ? transactionsRes.data.transactions || [] : []
      const commitments = commitmentsRes.data.status === 'ok' ? commitmentsRes.data.commitments || [] : []
      const tasks = tasksRes.data.status === 'ok' ? tasksRes.data.tasks || [] : []
      const integrations = integrationsRes.data.status === 'ok' ? integrationsRes.data.integrations || [] : []
      const stats = statsRes.data.status === 'ok' ? statsRes.data.stats || {} : {}

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
    } catch (err: any) {
      setError('Erro ao carregar dados do dashboard')
      console.error('Erro ao buscar dados do dashboard:', err)
    }
    setLoading(false)
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session) return <div>Você precisa estar autenticado.</div>

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
              <div className="flex items-center">
                <div className="w-1/2">
                  <FinancialChart transactions={transactions} onlyPie />
                </div>
                <div className="w-1/2 space-y-2 pl-6">
                  <span className="inline-flex items-center text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 mr-2"></span>
                    Alimentação
                  </span>
                  {/* Adicione mais categorias aqui */}
                </div>
              </div>
            </div>

            {/* Fluxo de Receitas vs Despesas */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Receitas vs Despesas</h3>
              <div className="h-[300px]">
                <FinancialChart transactions={transactions} onlyLine />
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <span className="inline-flex items-center text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mr-2"></span>
                  Receitas
                </span>
                <span className="inline-flex items-center text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mr-2"></span>
                  Despesas
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
} 