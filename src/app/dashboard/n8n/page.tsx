"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'

interface Workflow {
  id: string
  name: string
  status: 'active' | 'inactive' | 'error'
  lastExecution: string
  executionsToday: number
  successRate: number
}

interface ExecutionLog {
  id: string
  workflowName: string
  status: 'success' | 'error' | 'running'
  startTime: string
  endTime?: string
  duration?: number
  errorMessage?: string
}

const statusColors = {
  active: 'text-green-600',
  inactive: 'text-gray-600',
  error: 'text-red-600',
}

const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
  error: 'Erro',
}

const executionStatusColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  running: 'text-blue-600',
}

const executionStatusLabels = {
  success: 'Sucesso',
  error: 'Erro',
  running: 'Executando',
}

export default function N8NPage() {
  const { data: session, status } = useSession()
  const { isAdminMode } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // OWNER ou SUPER_ADMIN em modo admin podem ver N8N
    if (status === 'authenticated' && (userRole === 'OWNER' || (userRole === 'SUPER_ADMIN' && isAdminMode))) {
      fetchN8NData()
    }
  }, [status, session, userRole, isAdminMode])

  async function fetchN8NData() {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/n8n/workflows')
      const data = response.data

      if (data.status === 'ok') {
        setWorkflows(data.workflows || [])
        setExecutionLogs(data.executionLogs || [])
      } else {
        setError(data.message || 'Erro ao carregar dados do N8N')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados do N8N')
      console.error('Erro ao buscar dados do N8N:', err)
    }
    setLoading(false)
  }

  async function toggleWorkflowStatus(id: string) {
    setError('')
    setSuccess('')
    try {
      const workflow = workflows.find((w) => w.id === id)
      if (!workflow) return

      const newStatus = workflow.status === 'active' ? 'inactive' : 'active'
      
      const response = await apiClient.patch('/n8n/workflows', {
        workflowId: workflow.id,
        status: newStatus,
      })

      const data = response.data

      if (data.status === 'ok') {
        setSuccess('Status do workflow atualizado!')
        fetchN8NData()
      } else {
        setError(data.message || 'Erro ao atualizar status do workflow')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status do workflow')
      console.error('Erro ao atualizar workflow:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }
  
  // OWNER ou SUPER_ADMIN em modo admin podem ver N8N
  if (!session || !session.user || (userRole !== 'OWNER' && (userRole !== 'SUPER_ADMIN' || !isAdminMode))) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso restrito.</p>
          <p className="text-sm mt-1">Apenas Owners ou Super Admins no modo Admin podem ver monitoramento N8N.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Monitoramento N8N
        </h1>
        <button
          onClick={fetchN8NData}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-emerald-500/30 hover:border-cyan-500/50 transition-all"
        >
          Atualizar Dados
        </button>
      </div>
      
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {success && <div className="text-emerald-400 mb-4">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Status geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg">
                  <span className="text-emerald-400 text-xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Workflows Ativos</p>
                  <p className="text-2xl font-bold text-white">{workflows.filter(w => w.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Com Erro</p>
                  <p className="text-2xl font-bold text-white">{workflows.filter(w => w.status === 'error').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <span className="text-cyan-400 text-xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Execuções Hoje</p>
                  <p className="text-2xl font-bold text-white">{workflows.reduce((sum, w) => sum + w.executionsToday, 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                  <span className="text-purple-400 text-xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-white">
                    {workflows.length > 0 
                      ? (workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de workflows */}
          <div className="bg-white/5 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-medium text-white">Workflows</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="px-6 py-4 text-left font-medium">Nome</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Última Execução</th>
                    <th className="px-6 py-4 text-left font-medium">Execuções Hoje</th>
                    <th className="px-6 py-4 text-left font-medium">Taxa de Sucesso</th>
                    <th className="px-6 py-4 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {workflows.map(workflow => (
                    <tr key={workflow.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{workflow.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          workflow.status === 'active' 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400'
                            : workflow.status === 'error'
                            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400'
                            : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400'
                        }`}>
                          {statusLabels[workflow.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(workflow.lastExecution).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">{workflow.executionsToday}</td>
                      <td className="px-6 py-4">
                        <span className={workflow.successRate > 90 ? 'text-emerald-400' : workflow.successRate > 70 ? 'text-yellow-400' : 'text-red-400'}>
                          {workflow.successRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleWorkflowStatus(workflow.id)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            workflow.status === 'active'
                              ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30 hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-500/50'
                              : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-green-500/30 hover:border-emerald-500/50'
                          } transition-all`}
                        >
                          {workflow.status === 'active' ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logs de execução */}
          <div className="bg-white/5 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-medium text-white">Logs de Execução</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="px-6 py-4 text-left font-medium">Workflow</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Início</th>
                    <th className="px-6 py-4 text-left font-medium">Duração</th>
                    <th className="px-6 py-4 text-left font-medium">Erro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {executionLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{log.workflowName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400'
                            : log.status === 'error'
                            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400'
                            : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400'
                        }`}>
                          {executionStatusLabels[log.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(log.startTime).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">{log.duration ? `${log.duration}s` : '-'}</td>
                      <td className="px-6 py-4 text-red-400">
                        {log.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 