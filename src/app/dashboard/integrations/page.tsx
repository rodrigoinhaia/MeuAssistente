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
  RiSettings3Line
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchIntegrations()
      fetchSyncHistory()
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

  function getProviderName(provider: string) {
    switch (provider) {
      case 'google':
        return 'Google Calendar & Tasks'
      default:
        return provider
    }
  }

  function getScopeDescription(scope: string) {
    if (scope?.includes('calendar')) return 'Calendário e Compromissos'
    if (scope?.includes('tasks')) return 'Tarefas'
    return scope
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
        </div>
      </div>

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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <RiGoogleFill className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{getProviderName(integration.provider)}</h3>
                      <p className="text-sm text-slate-600">{getScopeDescription(integration.scope)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    integration.isActive
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {integration.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
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
    </div>
  )
}
