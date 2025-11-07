"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'

interface ReportData {
  totalRevenue: number
  activeSubscriptions: number
  totalUsers: number
  totalfamilys: number
  monthlyGrowth: number
  churnRate: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const { isAdminMode } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // OWNER ou SUPER_ADMIN em modo admin podem ver relatórios
    if (status === 'authenticated' && (userRole === 'OWNER' || (userRole === 'SUPER_ADMIN' && isAdminMode))) {
      fetchReportData()
    }
  }, [status, session, userRole, isAdminMode])

  async function fetchReportData() {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/reports')
      const data = response.data

      if (data.status === 'ok') {
        setReportData(data.reportData)
        setMonthlyRevenue(data.monthlyRevenue || [])
      } else {
        setError(data.message || 'Erro ao carregar relatórios')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar relatórios')
      console.error('Erro ao buscar relatórios:', err)
    }
    setLoading(false)
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }
  
  // OWNER ou SUPER_ADMIN em modo admin podem ver relatórios
  if (!session || !session.user || (userRole !== 'OWNER' && (userRole !== 'SUPER_ADMIN' || !isAdminMode))) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso restrito.</p>
          <p className="text-sm mt-1">Apenas Owners ou Super Admins no modo Admin podem ver relatórios.</p>
        </div>
      </div>
    )
  }

  if (loading) return <div>Carregando relatórios...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!reportData) return <div>Nenhum dado disponível</div>

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
        Relatórios
      </h1>
      
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg">
              <span className="text-emerald-400 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-white">
                R$ {reportData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg">
              <span className="text-cyan-400 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Assinaturas Ativas</p>
              <p className="text-2xl font-bold text-white">{reportData.activeSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
              <span className="text-purple-400 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total de Usuários</p>
              <p className="text-2xl font-bold text-white">{reportData.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
              <span className="text-amber-400 text-xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total de Clientes</p>
              <p className="text-2xl font-bold text-white">{reportData.totalfamilys}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de crescimento e churn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-4">Crescimento Mensal</h3>
          <div className="flex items-center">
            <span className={`text-2xl font-bold ${reportData.monthlyGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth}%
            </span>
            <span className="ml-2 text-gray-400">vs mês anterior</span>
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-4">Taxa de Churn</h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-red-400">
              {reportData.churnRate}%
            </span>
            <span className="ml-2 text-gray-400">por mês</span>
          </div>
        </div>
      </div>

      {/* Gráfico de receita mensal */}
      <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-white mb-4">Receita Mensal</h3>
        <div className="flex items-end space-x-4 h-32">
          {monthlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue))
            const height = (item.revenue / maxRevenue) * 100
            const heightClass = (() => {
              if (height >= 100) return 'h-32'
              if (height >= 90) return 'h-28'
              if (height >= 80) return 'h-24'
              if (height >= 70) return 'h-20'
              if (height >= 60) return 'h-16'
              if (height >= 50) return 'h-12'
              if (height >= 40) return 'h-10'
              if (height >= 30) return 'h-8'
              if (height >= 20) return 'h-6'
              if (height >= 10) return 'h-4'
              return 'h-2'
            })()
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  title={`Receita de ${item.month}`}
                  className={`w-full bg-gradient-to-t from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 rounded-t ${heightClass}`}
                ></div>
                <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                <span className="text-xs font-medium text-white">R$ {item.revenue.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Relatórios detalhados */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-4">Relatórios Disponíveis</h3>
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
              <span className="text-cyan-400 mr-2">📄</span>
              Relatório de Faturamento Detalhado
            </li>
            <li className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
              <span className="text-cyan-400 mr-2">📄</span>
              Análise de Usuários por Cliente
            </li>
            <li className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
              <span className="text-cyan-400 mr-2">📄</span>
              Métricas de Uso do Sistema
            </li>
            <li className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
              <span className="text-cyan-400 mr-2">📄</span>
              Relatório de Churn e Retenção
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-4">Exportar Dados</h3>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 py-2 px-4 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-500/50 transition-all">
              Exportar Relatório CSV
            </button>
            <button className="w-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 py-2 px-4 rounded-lg hover:from-emerald-500/30 hover:to-green-500/30 hover:border-emerald-500/50 transition-all">
              Gerar Relatório PDF
            </button>
            <button className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 py-2 px-4 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-500/50 transition-all">
              Enviar por Email
            </button>
          </div>
        </div>
      </div>
    </main>
  )
} 