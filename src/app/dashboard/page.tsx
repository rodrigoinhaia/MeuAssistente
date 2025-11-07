"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
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
        axios.get('/api/transactions'),
        axios.get('/api/commitments'),
        axios.get('/api/tasks'),
        axios.get('/api/integrations'),
        axios.get('/api/dashboard/stats'),
      ])

      const transactionsData = transactionsRes.data.transactions || []
      const commitments = commitmentsRes.data.commitments || []
      const tasks = tasksRes.data.tasks || []
      const integrations = integrationsRes.data.integrations || []
      const stats = statsRes.data.stats || {}

      setTransactions(transactionsData)

      // Calcular métricas
      const totalIncome = transactionsData
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)

      const totalExpense = transactionsData
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400">Bem-vindo ao seu painel de controle</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-emerald-500/30 hover:border-cyan-500/50 transition-all"
        >
          Atualizar
        </button>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Receber Hoje */}
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-gray-400 text-sm font-medium mb-1">A Receber Hoje</div>
                <div className="text-2xl font-bold text-emerald-400 mb-2">
                  R$ {data.stats?.receiveToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
                <div className="text-sm text-gray-400">
                  Restante do mês: <span className="font-medium text-white">
                    R$ {data.stats?.receiveRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:from-emerald-500/30 hover:to-green-500/30 hover:border-emerald-500/50 transition-all">
                Novo Recebimento
              </button>
            </div>

            {/* Pagar Hoje */}
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-gray-400 text-sm font-medium mb-1">A Pagar Hoje</div>
                <div className="text-2xl font-bold text-red-400 mb-2">
                  R$ {data.stats?.payToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </div>
                <div className="text-sm text-gray-400">
                  Restante do mês: <span className="font-medium text-white">
                    R$ {data.stats?.payRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-500/50 transition-all">
                Novo Pagamento
              </button>
            </div>

            {/* Recebimentos em Atraso */}
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20">
                  <span className="text-emerald-400 text-xl">⬇️</span>
                </div>
                <div className="text-gray-400 text-sm font-medium">Recebimentos em Atraso</div>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                R$ {data.stats?.overdueIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>

            {/* Pagamentos em Atraso */}
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20">
                  <span className="text-red-400 text-xl">⬆️</span>
                </div>
                <div className="text-gray-400 text-sm font-medium">Pagamentos em Atraso</div>
              </div>
              <div className="text-2xl font-bold text-red-400">
                R$ {data.stats?.overdueExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium mb-1">Receitas</div>
              <div className="text-2xl font-bold text-emerald-400">
                R$ {data.stats?.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium mb-1">Despesas</div>
              <div className="text-2xl font-bold text-red-400">
                R$ {data.stats?.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium mb-1">Saldo</div>
              <div className={`text-2xl font-bold ${(data.stats?.balance || 0) >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {data.stats && data.stats.balance < 0 ? '-' : ''}R$ {Math.abs(data.stats?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Gráfico de Fluxo de Caixa */}
          <div className="bg-white/5 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-medium text-white mb-4">Fluxo de Caixa Completo</h3>
            <div className="h-[300px]">
              <CashFlowChart transactions={transactions} />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <span className="inline-flex items-center text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 mr-2"></span>
                Recebimentos
              </span>
              <span className="inline-flex items-center text-red-400">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-pink-400 mr-2"></span>
                Pagamentos
              </span>
              <span className="inline-flex items-center text-cyan-400">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 mr-2"></span>
                Saldo
              </span>
            </div>
          </div>

          {/* Gráficos detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Despesas por Categoria */}
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-medium text-white mb-4">Despesas por Categoria</h3>
              <div className="flex items-center">
                <div className="w-1/2">
                  <FinancialChart transactions={transactions} onlyPie />
                </div>
                <div className="w-1/2 space-y-2 pl-6">
                  <span className="inline-flex items-center text-gray-300">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 mr-2"></span>
                    Alimentação
                  </span>
                  {/* Adicione mais categorias aqui */}
                </div>
              </div>
            </div>

            {/* Fluxo de Receitas vs Despesas */}
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-medium text-white mb-4">Receitas vs Despesas</h3>
              <div className="h-[300px]">
                <FinancialChart transactions={transactions} onlyLine />
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <span className="inline-flex items-center text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 mr-2"></span>
                  Receitas
                </span>
                <span className="inline-flex items-center text-red-400">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-pink-400 mr-2"></span>
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