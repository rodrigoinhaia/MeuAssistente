"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import apiClient from '@/lib/axios-config'
import {
  RiRadarLine,
  RiGoogleFill,
  RiCalendarLine,
  RiFileListLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiDownloadLine,
  RiUploadLine,
  RiTimeLine,
  RiErrorWarningLine,
  RiCheckLine,
  RiPlugLine,
  RiSettings3Line,
  RiWhatsappFill,
  RiLink,
  RiKeyLine,
  RiServerLine,
  RiQrCodeLine,
  RiDeleteBinLine,
  RiBankLine,
  RiMoneyDollarCircleLine,
  RiRefreshLine as RiRefreshLineIcon
} from 'react-icons/ri'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Integration {
  id: string
  provider: string
  scope: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

interface SyncHistory {
  type: string
  date: string
  status: 'success' | 'error'
  count: number
  errors: number
  details?: any[]
}

export default function IntegrationsPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [syncResults, setSyncResults] = useState<any[]>([])
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showN8NModal, setShowN8NModal] = useState(false)
  const [n8nForm, setN8nForm] = useState({
    n8nUrl: '',
    n8nApiKey: '',
    webhookUrl: '',
  })
  const [n8nStatus, setN8nStatus] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [showOpenFinanceModal, setShowOpenFinanceModal] = useState(false)
  const [bankConnections, setBankConnections] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const [syncingBank, setSyncingBank] = useState<string | null>(null)
  const [categorizing, setCategorizing] = useState(false)
  const [showEvolutionModal, setShowEvolutionModal] = useState(false)
  const [evolutionForm, setEvolutionForm] = useState({
    apiUrl: '',
    apiKey: '',
    instanceName: '',
  })
  const [evolutionStatus, setEvolutionStatus] = useState<any>(null)
  const [checkingEvolutionStatus, setCheckingEvolutionStatus] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchIntegrations()
      fetchSyncHistory()
      fetchBankConnections()
      fetchInstitutions()
    }
    
    // Verificar feedback de callback OAuth
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')
    
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
    if (successParam) {
      setSuccess('Conta Google conectada com sucesso!')
    }
  }, [status, searchParams])

  async function fetchIntegrations() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/integrations')
      setIntegrations(res.data.integrations || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar integrações')
    }
    setLoading(false)
  }

  async function connectGoogle() {
    setConnecting(true)
    setError('')
    try {
      const res = await apiClient.get('/auth/google/authorize')
      if (res.data.status === 'ok') {
        window.location.href = res.data.authUrl
      } else {
        setError(res.data.message || 'Erro ao iniciar conexão')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar Google')
    }
    setConnecting(false)
  }

  async function fetchSyncHistory() {
    try {
      const res = await apiClient.get('/sync/history')
      setSyncHistory(res.data.logs || [])
    } catch (err: any) {
      // fallback: mantém histórico local vazio
    }
  }

  async function addSyncHistory(entry: SyncHistory) {
    setSyncHistory(prev => [entry, ...prev.slice(0, 19)]) // otimista
    try {
      await apiClient.post('/sync/history', entry)
      fetchSyncHistory() // garante atualização
    } catch (err) {
      // fallback: mantém histórico local
    }
  }

  async function handleSync(action: string, type: 'calendar' | 'tasks') {
    setError('')
    setSuccess('')
    setSyncing(`${action}_${type}`)
    setSyncResults([])
    
    try {
      const endpoint = type === 'calendar' ? '/sync/google-calendar' : '/sync/google-tasks'
      const res = await apiClient.post(endpoint, { action })
      
      const actionLabel = action === 'sync_to_google' 
        ? (type === 'calendar' ? 'Exportar para Google Calendar' : 'Exportar para Google Tasks')
        : (type === 'calendar' ? 'Importar do Google Calendar' : 'Importar do Google Tasks')
      
      setSuccess(`${actionLabel.replace('Exportar para ', '').replace('Importar do ', '')} sincronizado com sucesso!`)
      setSyncResults(res.data.results || [])
      
      addSyncHistory({
        type: actionLabel,
        date: new Date().toISOString(),
        status: 'success',
        count: (res.data.results || []).filter((r: any) => r.status !== 'error').length,
        errors: (res.data.results || []).filter((r: any) => r.status === 'error').length,
        details: res.data.results || [],
      })
    } catch (err: any) {
      const actionLabel = action === 'sync_to_google' 
        ? (type === 'calendar' ? 'Exportar para Google Calendar' : 'Exportar para Google Tasks')
        : (type === 'calendar' ? 'Importar do Google Calendar' : 'Importar do Google Tasks')
      
      setError(err.response?.data?.error || `Erro ao sincronizar ${type === 'calendar' ? 'compromissos' : 'tarefas'}`)
      
      addSyncHistory({
        type: actionLabel,
        date: new Date().toISOString(),
        status: 'error',
        count: 0,
        errors: 1,
        details: [{ status: 'error', error: err.response?.data?.error || 'Erro desconhecido' }],
      })
    }
    setSyncing(null)
  }

  function getErrorMessage(error: string) {
    switch (error) {
      case 'access_denied':
        return 'Acesso negado pelo Google'
      case 'invalid_request':
        return 'Requisição inválida'
      case 'integration_failed':
        return 'Erro ao salvar integração'
      default:
        return 'Erro desconhecido'
    }
  }

  async function connectN8N() {
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.post('/integrations/n8n', n8nForm)
      if (res.data.status === 'ok') {
        setSuccess('N8N conectado com sucesso!')
        setShowN8NModal(false)
        setN8nForm({ n8nUrl: '', n8nApiKey: '', webhookUrl: '' })
        fetchIntegrations()
      } else {
        setError(res.data.message || 'Erro ao conectar N8N')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar N8N')
    }
  }

  async function checkN8NStatus() {
    setCheckingStatus(true)
    try {
      const res = await apiClient.get('/integrations/n8n')
      if (res.data.status === 'ok') {
        setN8nStatus(res.data.n8n)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao verificar status')
    }
    setCheckingStatus(false)
  }

  async function disconnectN8N() {
    if (!confirm('Tem certeza que deseja desconectar o N8N?')) return
    
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.delete('/integrations/n8n')
      if (res.data.status === 'ok') {
        setSuccess('N8N desconectado com sucesso!')
        setN8nStatus(null)
        fetchIntegrations()
      } else {
        setError(res.data.message || 'Erro ao desconectar N8N')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao desconectar N8N')
    }
  }

  async function fetchBankConnections() {
    try {
      const res = await apiClient.get('/integrations/open-finance')
      setBankConnections(res.data.connections || [])
    } catch (err: any) {
      // Silencioso - pode não ter conexões ainda
    }
  }

  async function fetchInstitutions() {
    try {
      const res = await apiClient.get('/integrations/open-finance?action=institutions')
      setInstitutions(res.data.institutions || [])
    } catch (err: any) {
      // Silencioso
    }
  }

  async function connectBank(institutionId: string, institutionName: string) {
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.post('/integrations/open-finance', {
        institutionId,
        institutionName,
      })
      if (res.data.status === 'ok') {
        // Redirecionar para URL de autorização do Open Finance
        if (res.data.authUrl) {
          window.location.href = res.data.authUrl
        } else {
          setSuccess('Conexão iniciada! Siga as instruções para autorizar.')
          setShowOpenFinanceModal(false)
          fetchBankConnections()
        }
      } else {
        setError(res.data.message || 'Erro ao conectar conta bancária')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar conta bancária')
    }
  }

  async function syncBankTransactions(connectionId: string) {
    setSyncingBank(connectionId)
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.post('/sync/open-finance', { connectionId })
      if (res.data.status === 'ok') {
        setSuccess(`Sincronização concluída: ${res.data.imported} transações importadas`)
        // Disparar categorização automática
        setTimeout(() => categorizeTransactions(), 1000)
      } else {
        setError(res.data.message || 'Erro ao sincronizar transações')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao sincronizar transações')
    }
    setSyncingBank(null)
  }

  async function categorizeTransactions() {
    setCategorizing(true)
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.patch('/sync/open-finance')
      if (res.data.status === 'ok') {
        setSuccess(`Categorização concluída: ${res.data.categorized} transações categorizadas por IA`)
      }
    } catch (err: any) {
      // Silencioso - não é crítico
    }
    setCategorizing(false)
  }

  async function disconnectBank(connectionId: string) {
    if (!confirm('Tem certeza que deseja desconectar esta conta bancária?')) return
    
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.delete('/integrations/open-finance', {
        data: { connectionId },
      })
      if (res.data.status === 'ok') {
        setSuccess('Conta bancária desconectada com sucesso!')
        fetchBankConnections()
      } else {
        setError(res.data.message || 'Erro ao desconectar conta bancária')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao desconectar conta bancária')
    }
  }

  function getProviderName(provider: string) {
    switch (provider) {
      case 'google':
        return 'Google Calendar & Tasks'
      case 'n8n':
        return 'N8N (Automações & WhatsApp)'
      default:
        return provider
    }
  }

  function getProviderIcon(provider: string) {
    switch (provider) {
      case 'google':
        return <RiGoogleFill className="w-6 h-6" />
      case 'n8n':
        return <RiRadarLine className="w-6 h-6" />
      default:
        return <RiPlugLine className="w-6 h-6" />
    }
  }

  function getProviderColor(provider: string) {
    switch (provider) {
      case 'google':
        return 'from-blue-500 to-blue-600'
      case 'n8n':
        return 'from-purple-500 to-indigo-600'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  function getScopeDescription(scope: string) {
    if (scope?.includes('calendar')) return 'Calendário e Compromissos'
    if (scope?.includes('tasks')) return 'Tarefas'
    try {
      const parsed = JSON.parse(scope || '{}')
      if (parsed.n8nUrl) {
        return `N8N: ${parsed.n8nUrl}`
      }
    } catch {
      // Não é JSON, retorna como está
    }
    return scope || 'Automações e Processamento'
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Você precisa estar autenticado.</p>
        </div>
      </div>
    )
  }

  const hasGoogleIntegration = integrations.some(i => i.provider === 'google' && i.isActive)
  const hasN8NIntegration = integrations.some(i => i.provider === 'n8n' && i.isActive)
  const n8nIntegration = integrations.find(i => i.provider === 'n8n' && i.isActive)
  const hasBankConnections = bankConnections.length > 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Integrações
          </h1>
          <p className="text-slate-600 mt-1">Conecte e sincronize seus serviços externos</p>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          <div className="flex items-center gap-2">
            <RiErrorWarningLine className="w-5 h-5" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
          <div className="flex items-center gap-2">
            <RiCheckLine className="w-5 h-5" />
            <p className="font-semibold">{success}</p>
          </div>
        </div>
      )}

      {/* Conectar Serviços */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <RiPlugLine className="w-6 h-6 text-cyan-600" />
          Conectar Serviços
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={connectGoogle}
            disabled={connecting || hasGoogleIntegration}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              hasGoogleIntegration
                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
            }`}
          >
            <RiGoogleFill className="w-5 h-5" />
            {connecting ? 'Conectando...' : hasGoogleIntegration ? 'Google já conectado' : 'Conectar Google Calendar & Tasks'}
          </button>
          <button
            onClick={() => setShowN8NModal(true)}
            disabled={hasN8NIntegration}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              hasN8NIntegration
                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
            }`}
          >
            <RiRadarLine className="w-5 h-5" />
            {hasN8NIntegration ? 'N8N já conectado' : 'Conectar N8N (Automações & WhatsApp)'}
          </button>
          <button
            onClick={() => setShowOpenFinanceModal(true)}
            className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30"
          >
            <RiBankLine className="w-5 h-5" />
            Conectar Conta Bancária (Open Finance)
          </button>
        </div>
      </div>

      {/* Conexões Bancárias */}
      {hasBankConnections && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RiBankLine className="w-6 h-6 text-emerald-600" />
            Contas Bancárias Conectadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankConnections.map(connection => (
              <div
                key={connection.id}
                className="bg-gradient-to-br from-white to-emerald-50 rounded-xl p-5 border-2 border-emerald-200 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                      <RiBankLine className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{connection.institutionName}</h3>
                      <p className="text-sm text-slate-600">
                        {connection.accountType === 'checking' ? 'Conta Corrente' : 
                         connection.accountType === 'savings' ? 'Conta Poupança' :
                         connection.accountType === 'credit_card' ? 'Cartão de Crédito' : 'Conta'}
                        {connection.accountNumber && ` • ••• ${connection.accountNumber.slice(-4)}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    connection.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {connection.status === 'active' ? 'Ativa' : connection.status}
                  </span>
                </div>
                {connection.lastSyncAt && (
                  <div className="text-xs text-slate-500 mb-3">
                    Última sincronização: {format(new Date(connection.lastSyncAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncBankTransactions(connection.id)}
                    disabled={syncingBank === connection.id || connection.status !== 'active'}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {syncingBank === connection.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RiRefreshLineIcon className="w-4 h-4" />
                        Sincronizar Transações
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => disconnectBank(connection.id)}
                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Desconectar"
                  >
                    <RiDeleteBinLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {categorizing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Categorizando transações com IA...
            </div>
          )}
        </div>
      )}

      {/* Integrações Ativas */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <RiRadarLine className="w-6 h-6 text-cyan-600" />
          Integrações Ativas
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma integração conectada</h3>
            <p className="text-slate-600">Conecte seus serviços para começar a sincronizar dados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(integration => (
              <div
                key={integration.id}
                className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 border-2 border-slate-200 hover:border-cyan-300 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getProviderColor(integration.provider)} flex items-center justify-center text-white flex-shrink-0`}>
                      {getProviderIcon(integration.provider)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-slate-800">{getProviderName(integration.provider)}</h3>
                      <p className="text-sm text-slate-600 truncate">{getScopeDescription(integration.scope)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {integration.provider === 'n8n' && (
                      <button
                        onClick={checkN8NStatus}
                        disabled={checkingStatus}
                        className="p-2 rounded-lg hover:bg-cyan-50 text-cyan-600 transition-colors"
                        title="Verificar status"
                      >
                        {checkingStatus ? (
                          <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RiRefreshLine className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {integration.provider === 'n8n' && (
                      <button
                        onClick={disconnectN8N}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        title="Desconectar"
                      >
                        <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      integration.isActive
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {integration.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                {integration.provider === 'n8n' && n8nStatus && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {n8nStatus.connected ? (
                          <>
                            <RiCheckboxCircleLine className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">Conectado</span>
                          </>
                        ) : (
                          <>
                            <RiCloseCircleLine className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Desconectado</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="font-medium">Workflows:</span> {n8nStatus.totalWorkflows} total, {n8nStatus.activeWorkflows} ativos
                      </div>
                      <div>
                        <span className="font-medium">URL:</span> {n8nStatus.url}
                      </div>
                    </div>
                    {n8nStatus.workflows && n8nStatus.workflows.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-700 mb-1">Workflows Ativos:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {n8nStatus.workflows.slice(0, 3).map((w: any) => (
                            <li key={w.id} className="flex items-center gap-1">
                              <RiCheckboxCircleLine className="w-3 h-3 text-emerald-600" />
                              {w.name}
                            </li>
                          ))}
                          {n8nStatus.workflows.length > 3 && (
                            <li className="text-slate-500">+{n8nStatus.workflows.length - 3} mais</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <RiTimeLine className="w-4 h-4" />
                    <span>Conectado em {format(new Date(integration.createdAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                  {integration.expiresAt && (
                    <div className="flex items-center gap-2">
                      <RiCalendarLine className="w-4 h-4" />
                      <span>Expira em {format(new Date(integration.expiresAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sincronização Manual */}
      {hasGoogleIntegration && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RiSettings3Line className="w-6 h-6 text-cyan-600" />
            Sincronização Manual
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Calendar */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <RiCalendarLine className="w-8 h-8 text-blue-600" />
                <h3 className="font-semibold text-lg text-blue-800">Google Calendar</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleSync('sync_to_google', 'calendar')}
                  disabled={syncing === 'sync_to_google_calendar'}
                  className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {syncing === 'sync_to_google_calendar' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RiUploadLine className="w-4 h-4" />
                      Exportar para Google
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSync('sync_from_google', 'calendar')}
                  disabled={syncing === 'sync_from_google_calendar'}
                  className="w-full px-4 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {syncing === 'sync_from_google_calendar' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <RiDownloadLine className="w-4 h-4" />
                      Importar do Google
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Google Tasks */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <RiFileListLine className="w-8 h-8 text-emerald-600" />
                <h3 className="font-semibold text-lg text-emerald-800">Google Tasks</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleSync('sync_to_google', 'tasks')}
                  disabled={syncing === 'sync_to_google_tasks'}
                  className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {syncing === 'sync_to_google_tasks' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RiUploadLine className="w-4 h-4" />
                      Exportar para Google
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSync('sync_from_google', 'tasks')}
                  disabled={syncing === 'sync_from_google_tasks'}
                  className="w-full px-4 py-2.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {syncing === 'sync_from_google_tasks' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <RiDownloadLine className="w-4 h-4" />
                      Importar do Google
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resultados da Sincronização */}
          {syncResults.length > 0 && (
            <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-64 overflow-auto">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <RiRefreshLine className="w-5 h-5" />
                Resultados da Sincronização
              </h3>
              <ul className="space-y-2 text-sm">
                {syncResults.map((r, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      r.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {r.status === 'error' ? (
                      <RiCloseCircleLine className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <RiCheckboxCircleLine className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="flex-1">
                      {r.status === 'error'
                        ? `Erro: ${r.error || 'Falha desconhecida'} (ID: ${r.taskId || r.commitmentId || r.googleTaskId || r.googleEventId || '-'})`
                        : `OK: ${r.taskId || r.commitmentId || r.googleTaskId || r.googleEventId || '-'} ${r.status}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Histórico de Sincronizações */}
      {syncHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RiTimeLine className="w-6 h-6 text-cyan-600" />
            Histórico de Sincronizações
          </h2>
          <div className="space-y-3">
            {syncHistory.map((h, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {h.status === 'success' ? (
                      <RiCheckboxCircleLine className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <RiCloseCircleLine className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${h.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {h.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(h.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="text-emerald-700 font-medium">{h.count} sucesso(s)</span>
                  {h.errors > 0 && <span className="text-red-700 font-medium">{h.errors} erro(s)</span>}
                </div>
                {h.details && h.details.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                      Ver detalhes
                    </summary>
                    <ul className="mt-2 pl-4 space-y-1 text-xs">
                      {h.details.map((d: any, j: number) => (
                        <li
                          key={j}
                          className={d.status === 'error' ? 'text-red-600' : 'text-emerald-700'}
                        >
                          {d.status === 'error'
                            ? `Erro: ${d.error || 'Falha desconhecida'} (ID: ${d.taskId || d.commitmentId || d.googleTaskId || d.googleEventId || '-'})`
                            : `OK: ${d.taskId || d.commitmentId || d.googleTaskId || d.googleEventId || '-'} ${d.status}`}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal N8N */}
      {showN8NModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                <RiRadarLine className="w-6 h-6 text-purple-600" />
                Conectar N8N
              </h2>
              <button
                onClick={() => {
                  setShowN8NModal(false)
                  setN8nForm({ n8nUrl: '', n8nApiKey: '', webhookUrl: '' })
                  setError('')
                }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <RiCloseCircleLine className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <RiServerLine className="w-4 h-4" />
                  URL do N8N *
                </label>
                <input
                  type="url"
                  placeholder="http://localhost:5678 ou https://n8n.seudominio.com"
                  value={n8nForm.n8nUrl}
                  onChange={e => setN8nForm({ ...n8nForm, n8nUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">URL base da sua instância N8N</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <RiKeyLine className="w-4 h-4" />
                  API Key do N8N *
                </label>
                <input
                  type="password"
                  placeholder="Sua API Key do N8N"
                  value={n8nForm.n8nApiKey}
                  onChange={e => setN8nForm({ ...n8nForm, n8nApiKey: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Chave de API gerada no N8N (Settings → API)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <RiLink className="w-4 h-4" />
                  Webhook URL (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://seu-dominio.com/api/webhooks/n8n"
                  value={n8nForm.webhookUrl}
                  onChange={e => setN8nForm({ ...n8nForm, webhookUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">URL para receber webhooks do N8N (padrão será gerado automaticamente)</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-800">
                  <strong>💡 Dica:</strong> O N8N será responsável por processar mensagens do WhatsApp. 
                  Configure workflows no N8N que se conectem com Evolution API ou outro provedor de WhatsApp.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowN8NModal(false)
                  setN8nForm({ n8nUrl: '', n8nApiKey: '', webhookUrl: '' })
                  setError('')
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={connectN8N}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
              >
                Conectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Open Finance */}
      {showOpenFinanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-slate-200/60 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                <RiBankLine className="w-6 h-6 text-emerald-600" />
                Conectar Conta Bancária (Open Finance)
              </h2>
              <button
                onClick={() => {
                  setShowOpenFinanceModal(false)
                  setError('')
                }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <RiCloseCircleLine className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>🔒 Seguro e Regulado:</strong> O Open Finance é regulado pelo Banco Central do Brasil. 
                Suas credenciais bancárias nunca são armazenadas. Você autoriza o acesso diretamente no seu banco.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Selecione seu banco:
              </label>
              {institutions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Carregando bancos disponíveis...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {institutions.map(institution => (
                    <button
                      key={institution.id}
                      onClick={() => connectBank(institution.id, institution.name)}
                      className="p-4 bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-slate-200 hover:border-emerald-300 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                          {institution.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{institution.name}</p>
                          <p className="text-xs text-slate-500">Código: {institution.code}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600">
                <strong>Como funciona:</strong> Ao selecionar seu banco, você será redirecionado para a página de autorização do banco. 
                Após autorizar, suas transações serão importadas automaticamente e categorizadas por IA.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
