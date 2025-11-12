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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Erro ao carregar relatórios</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }
  
  if (!reportData) {
    return (
      <div className="p-8">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-600 shadow-sm">
          <p className="font-semibold">Nenhum dado disponível</p>
          <p className="text-sm mt-1">Não há dados de relatórios disponíveis no momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Relatórios
          </h1>
          <p className="text-slate-600 mt-1">Análise completa de métricas e desempenho</p>
        </div>
        <button
          onClick={fetchReportData}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
        >
          Atualizar
        </button>
      </div>
      
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600 font-semibold mb-1">Receita Total</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                R$ {reportData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600 font-semibold mb-1">Assinaturas Ativas</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                {reportData.activeSubscriptions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600 font-semibold mb-1">Total de Usuários</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {reportData.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600 font-semibold mb-1">Total de Clientes</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {reportData.totalfamilys}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de crescimento e churn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Crescimento Mensal</h3>
          <div className="flex items-center">
            <span className={`text-3xl font-bold ${reportData.monthlyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth}%
            </span>
            <span className="ml-3 text-slate-600 text-sm">vs mês anterior</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Taxa de Churn</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-red-500">
              {reportData.churnRate}%
            </span>
            <span className="ml-3 text-slate-600 text-sm">por mês</span>
          </div>
        </div>
      </div>

      {/* Gráfico de receita mensal */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Receita Mensal</h3>
        <div className="flex items-end space-x-4 h-48">
          {monthlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1)
            const height = (item.revenue / maxRevenue) * 100
            const heightClass = (() => {
              if (height >= 100) return 'h-full'
              if (height >= 90) return 'h-[90%]'
              if (height >= 80) return 'h-[80%]'
              if (height >= 70) return 'h-[70%]'
              if (height >= 60) return 'h-[60%]'
              if (height >= 50) return 'h-[50%]'
              if (height >= 40) return 'h-[40%]'
              if (height >= 30) return 'h-[30%]'
              if (height >= 20) return 'h-[20%]'
              if (height >= 10) return 'h-[10%]'
              return 'h-[5%]'
            })()
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div
                  title={`Receita de ${item.month}: R$ ${item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  className={`w-full bg-gradient-to-t from-cyan-500 via-teal-500 to-emerald-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer ${heightClass}`}
                ></div>
                <span className="text-xs text-slate-500 mt-2 font-medium">{item.month}</span>
                <span className="text-xs font-semibold text-slate-700 mt-1">R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Relatórios detalhados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Relatórios Disponíveis</h3>
          <ul className="space-y-3">
            <li className="flex items-center text-sm text-slate-700 hover:text-cyan-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-50">
              <span className="text-cyan-500 mr-3 text-lg">📄</span>
              <span className="font-medium">Relatório de Faturamento Detalhado</span>
            </li>
            <li className="flex items-center text-sm text-slate-700 hover:text-cyan-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-50">
              <span className="text-cyan-500 mr-3 text-lg">📄</span>
              <span className="font-medium">Análise de Usuários por Cliente</span>
            </li>
            <li className="flex items-center text-sm text-slate-700 hover:text-cyan-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-50">
              <span className="text-cyan-500 mr-3 text-lg">📄</span>
              <span className="font-medium">Métricas de Uso do Sistema</span>
            </li>
            <li className="flex items-center text-sm text-slate-700 hover:text-cyan-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-50">
              <span className="text-cyan-500 mr-3 text-lg">📄</span>
              <span className="font-medium">Relatório de Churn e Retenção</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Exportar Dados</h3>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2.5 px-4 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium">
              Exportar Relatório CSV
            </button>
            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 px-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-medium">
              Gerar Relatório PDF
            </button>
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium">
              Enviar por Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 