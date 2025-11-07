"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical'
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  activeUsers: number
  requestsPerMinute: number
  averageResponseTime: number
  errorRate: number
  lastIncident?: {
    date: string
    description: string
  }
}

interface ServiceHealth {
  name: string
  status: 'operational' | 'degraded' | 'down'
  uptime: number
  lastCheck: string
}

export default function MonitorPage() {
  const { data: session, status } = useSession()
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000) // Atualiza a cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  async function fetchSystemStatus() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/system/monitor')
      const data = await response.json()

      if (data.status === 'ok') {
        setSystemStatus(data.systemStatus)
        setServices(data.services || [])
      } else {
        setError(data.message || 'Falha ao atualizar dados de monitoramento')
      }
    } catch (err) {
      console.error('Erro ao buscar status do sistema:', err)
      setError('Falha ao atualizar dados de monitoramento')
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30'
        }
      case 'warning':
      case 'degraded':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30'
        }
      case 'critical':
      case 'down':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30'
        }
    }
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session || !session.user || ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN')) return <div>Acesso restrito.</div>

  if (loading || !systemStatus) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Monitoramento do Sistema
        </h1>
        <button
          onClick={fetchSystemStatus}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-emerald-500/30 hover:border-cyan-500/50 transition-all"
        >
          Atualizar Dados
        </button>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">CPU</h3>
            <span className={`text-lg font-bold ${systemStatus.cpuUsage > 80 ? 'text-red-400' : systemStatus.cpuUsage > 60 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {systemStatus.cpuUsage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${systemStatus.cpuUsage > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : systemStatus.cpuUsage > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`}
              style={{ width: `${systemStatus.cpuUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Memória</h3>
            <span className={`text-lg font-bold ${systemStatus.memoryUsage > 80 ? 'text-red-400' : systemStatus.memoryUsage > 60 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {systemStatus.memoryUsage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${systemStatus.memoryUsage > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : systemStatus.memoryUsage > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`}
              style={{ width: `${systemStatus.memoryUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Disco</h3>
            <span className={`text-lg font-bold ${systemStatus.diskUsage > 80 ? 'text-red-400' : systemStatus.diskUsage > 60 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {systemStatus.diskUsage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${systemStatus.diskUsage > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : systemStatus.diskUsage > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`}
              style={{ width: `${systemStatus.diskUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus.status).bg} ${getStatusColor(systemStatus.status).text}`}>
              {systemStatus.status === 'healthy' ? 'Saudável' : systemStatus.status === 'warning' ? 'Atenção' : 'Crítico'}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {systemStatus.lastIncident && (
              <div>
                <p>Último incidente:</p>
                <p className="text-gray-300">{new Date(systemStatus.lastIncident.date).toLocaleString()}</p>
                <p className="text-gray-300">{systemStatus.lastIncident.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Usuários Ativos</h3>
          <p className="text-3xl font-bold text-white">{systemStatus.activeUsers}</p>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Requisições/min</h3>
          <p className="text-3xl font-bold text-white">{systemStatus.requestsPerMinute}</p>
        </div>

        <div className="bg-white/5 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Taxa de Erro</h3>
          <p className={`text-3xl font-bold ${systemStatus.errorRate > 1 ? 'text-red-400' : systemStatus.errorRate > 0.5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {systemStatus.errorRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Status dos Serviços */}
      <div className="bg-white/5 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-medium text-white">Status dos Serviços</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {services.map((service, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div>
                <h3 className="text-sm font-medium text-white">{service.name}</h3>
                <p className="text-sm text-gray-400">Uptime: {service.uptime.toFixed(2)}%</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  Última verificação: {new Date(service.lastCheck).toLocaleTimeString()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status).bg} ${getStatusColor(service.status).text}`}>
                  {service.status === 'operational' ? 'Operacional' : service.status === 'degraded' ? 'Degradado' : 'Fora do ar'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}