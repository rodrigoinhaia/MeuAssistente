"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

interface Integration {
  id: string
  provider: string
  scope: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
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
  const [syncHistory, setSyncHistory] = useState<any[]>([])

  useEffect(() => {
    fetchIntegrations()
    fetchSyncHistory()
    
    // Verificar feedback de callback OAuth
    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')
    
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
    if (successParam) {
      setSuccess('Conta Google conectada com sucesso!')
    }
  }, [searchParams])

  async function fetchIntegrations() {
    setLoading(true)
    try {
      const res = await axios.get('/api/integrations')
      setIntegrations(res.data.integrations)
    } catch (err: any) {
      setError('Erro ao carregar integrações')
    }
    setLoading(false)
  }

  async function connectGoogle() {
    setConnecting(true)
    setError('')
    try {
      const res = await axios.get('/api/auth/google/authorize')
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
      const res = await axios.get('/api/sync/history')
      setSyncHistory(res.data.logs || [])
    } catch (err: any) {
      // fallback: mantém histórico local vazio
    }
  }

  // Função para registrar histórico no backend
  async function addSyncHistory(entry: any) {
    setSyncHistory(prev => [entry, ...prev.slice(0, 19)]) // otimista
    try {
      await axios.post('/api/sync/history', entry)
      fetchSyncHistory() // garante atualização
    } catch (err) {
      // fallback: mantém histórico local
    }
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

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session) return <div>Você precisa estar autenticado.</div>

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Integrações</h1>
      
      {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>}
      {success && <div className="text-green-600 mb-4 p-3 bg-green-50 rounded">{success}</div>}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Conectar Serviços</h2>
        <button
          onClick={connectGoogle}
          disabled={connecting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {connecting ? 'Conectando...' : 'Conectar Google Calendar & Tasks'}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Integrações Ativas</h2>
        {loading ? (
          <div>Carregando integrações...</div>
        ) : integrations.length === 0 ? (
          <div className="text-gray-500">Nenhuma integração conectada.</div>
        ) : (
          <div className="space-y-4">
            {integrations.map(integration => (
              <div key={integration.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{getProviderName(integration.provider)}</h3>
                    <p className="text-sm text-gray-600">
                      {getScopeDescription(integration.scope)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Conectado em: {new Date(integration.createdAt).toLocaleDateString()}
                    </p>
                    {integration.expiresAt && (
                      <p className="text-xs text-gray-500">
                        Expira em: {new Date(integration.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      integration.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {integration.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões de sincronização manual */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Sincronização Manual</h2>
        <div className="flex gap-4 flex-wrap mb-4">
          <button
            onClick={async () => {
              setError(''); setSuccess('');
              setLoading(true);
              setSyncResults([]);
              try {
                const res = await axios.post('/api/sync/google-calendar', { action: 'sync_to_google' })
                setSuccess('Compromissos sincronizados com o Google Calendar!')
                setSyncResults(res.data.results || [])
                addSyncHistory({
                  type: 'Exportar para Google Calendar',
                  date: new Date().toISOString(),
                  status: 'success',
                  count: (res.data.results || []).filter((r: any) => r.status !== 'error').length,
                  errors: (res.data.results || []).filter((r: any) => r.status === 'error').length,
                  details: res.data.results || [],
                })
              } catch (err: any) {
                setError(err.response?.data?.error || 'Erro ao sincronizar compromissos')
                addSyncHistory({
                  type: 'Exportar para Google Calendar',
                  date: new Date().toISOString(),
                  status: 'error',
                  count: 0,
                  errors: 1,
                  details: [{ status: 'error', error: err.response?.data?.error || 'Erro desconhecido' }],
                })
              }
              setLoading(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sincronizando...' : 'Sincronizar Google Calendar'}
          </button>
          <button
            onClick={async () => {
              setError(''); setSuccess('');
              setLoading(true);
              setSyncResults([]);
              try {
                const res = await axios.post('/api/sync/google-tasks', { action: 'sync_to_google' })
                setSuccess('Tarefas sincronizadas com o Google Tasks!')
                setSyncResults(res.data.results || [])
                addSyncHistory({
                  type: 'Exportar para Google Tasks',
                  date: new Date().toISOString(),
                  status: 'success',
                  count: (res.data.results || []).filter((r: any) => r.status !== 'error').length,
                  errors: (res.data.results || []).filter((r: any) => r.status === 'error').length,
                  details: res.data.results || [],
                })
              } catch (err: any) {
                setError(err.response?.data?.error || 'Erro ao sincronizar tarefas')
                addSyncHistory({
                  type: 'Exportar para Google Tasks',
                  date: new Date().toISOString(),
                  status: 'error',
                  count: 0,
                  errors: 1,
                  details: [{ status: 'error', error: err.response?.data?.error || 'Erro desconhecido' }],
                })
              }
              setLoading(false);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sincronizando...' : 'Sincronizar Google Tasks'}
          </button>
          <button
            onClick={async () => {
              setError(''); setSuccess('');
              setLoading(true);
              setSyncResults([]);
              try {
                const res = await axios.post('/api/sync/google-calendar', { action: 'sync_from_google' })
                setSuccess('Compromissos importados do Google Calendar!')
                setSyncResults(res.data.results || [])
                addSyncHistory({
                  type: 'Importar do Google Calendar',
                  date: new Date().toISOString(),
                  status: 'success',
                  count: (res.data.results || []).filter((r: any) => r.status !== 'error').length,
                  errors: (res.data.results || []).filter((r: any) => r.status === 'error').length,
                  details: res.data.results || [],
                })
              } catch (err: any) {
                setError(err.response?.data?.error || 'Erro ao importar compromissos')
                addSyncHistory({
                  type: 'Importar do Google Calendar',
                  date: new Date().toISOString(),
                  status: 'error',
                  count: 0,
                  errors: 1,
                  details: [{ status: 'error', error: err.response?.data?.error || 'Erro desconhecido' }],
                })
              }
              setLoading(false);
            }}
            className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Importando...' : 'Importar do Google Calendar'}
          </button>
          <button
            onClick={async () => {
              setError(''); setSuccess('');
              setLoading(true);
              setSyncResults([]);
              try {
                const res = await axios.post('/api/sync/google-tasks', { action: 'sync_from_google' })
                setSuccess('Tarefas importadas do Google Tasks!')
                setSyncResults(res.data.results || [])
                addSyncHistory({
                  type: 'Importar do Google Tasks',
                  date: new Date().toISOString(),
                  status: 'success',
                  count: (res.data.results || []).filter((r: any) => r.status !== 'error').length,
                  errors: (res.data.results || []).filter((r: any) => r.status === 'error').length,
                  details: res.data.results || [],
                })
              } catch (err: any) {
                setError(err.response?.data?.error || 'Erro ao importar tarefas')
                addSyncHistory({
                  type: 'Importar do Google Tasks',
                  date: new Date().toISOString(),
                  status: 'error',
                  count: 0,
                  errors: 1,
                  details: [{ status: 'error', error: err.response?.data?.error || 'Erro desconhecido' }],
                })
              }
              setLoading(false);
            }}
            className="bg-green-400 text-white px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Importando...' : 'Importar do Google Tasks'}
          </button>
        </div>
        {/* Resultados detalhados da sincronização */}
        {syncResults.length > 0 && (
          <div className="bg-gray-50 border rounded p-4 mt-2 max-h-64 overflow-auto">
            <h3 className="font-semibold mb-2">Resultados:</h3>
            <ul className="text-sm space-y-1">
              {syncResults.map((r, i) => (
                <li key={i} className={r.status === 'error' ? 'text-red-600' : 'text-green-700'}>
                  {r.status === 'error'
                    ? `Erro: ${r.error || 'Falha desconhecida'} (ID: ${r.taskId || r.commitmentId || r.googleTaskId || r.googleEventId || '-'})`
                    : `OK: ${r.taskId || r.commitmentId || r.googleTaskId || r.googleEventId || '-'} ${r.status}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Histórico de sincronizações */}
      {syncHistory.length > 0 && (
        <div className="bg-white border rounded p-4 mt-8">
          <h3 className="font-semibold mb-2">Histórico de Sincronizações</h3>
          <ul className="text-sm divide-y divide-gray-100">
            {syncHistory.map((h, i) => (
              <li key={i} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-bold ${h.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{h.type}</span>
                    <span className="ml-2 text-xs text-gray-500">{new Date(h.date).toLocaleString()}</span>
                  </div>
                  <div className="text-xs">
                    <span className="mr-2">{h.count} ok</span>
                    <span className={h.errors > 0 ? 'text-red-600' : 'text-gray-400'}>{h.errors} erro(s)</span>
                  </div>
                </div>
                {h.details && h.details.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-blue-600">Ver detalhes</summary>
                    <ul className="pl-4 mt-1 space-y-1">
                      {h.details.map((d: any, j: number) => (
                        <li key={j} className={d.status === 'error' ? 'text-red-600' : 'text-green-700'}>
                          {d.status === 'error'
                            ? `Erro: ${d.error || 'Falha desconhecida'} (ID: ${d.taskId || d.commitmentId || d.googleTaskId || d.googleEventId || '-'})`
                            : `OK: ${d.taskId || d.commitmentId || d.googleTaskId || d.googleEventId || '-'} ${d.status}`}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
} 