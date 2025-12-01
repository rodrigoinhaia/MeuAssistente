"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import {
  RiSettings4Line,
  RiBuildingLine,
  RiMailLine,
  RiUserLine,
  RiCalendarLine,
  RiPlugLine,
  RiNotificationLine,
  RiToolsLine,
  RiSaveLine,
  RiRefreshLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiShieldLine,
  RiWifiLine,
  RiBugLine
} from 'react-icons/ri'

interface SystemSettings {
  companyName: string
  supportEmail: string
  maxUsersPerfamily: number
  trialDays: number
  enableWhatsAppIntegration: boolean
  enableGoogleIntegration: boolean
  enableEmailNotifications: boolean
  enableSMSNotifications: boolean
  maintenanceMode: boolean
  debugMode: boolean
  stripePublishableKey?: string
  stripeSecretKey?: string
  stripeWebhookSecret?: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const currentUserRole = (session?.user as any)?.role

  // Verificar se é SUPER_ADMIN
  useEffect(() => {
    if (status === 'authenticated' && currentUserRole !== 'SUPER_ADMIN') {
      // Redirecionar para dashboard se não for SUPER_ADMIN
      window.location.href = '/dashboard'
    }
  }, [status, currentUserRole])

  // Se não for SUPER_ADMIN, não renderizar nada
  if (status === 'authenticated' && currentUserRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
          <p className="text-slate-600">Apenas Super Admins podem acessar as configurações do sistema.</p>
        </div>
      </div>
    )
  }

  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'MeuAssistente',
    supportEmail: 'suporte@meuassistente.com',
    maxUsersPerfamily: 50,
    trialDays: 14,
    enableWhatsAppIntegration: true,
    enableGoogleIntegration: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    maintenanceMode: false,
    debugMode: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  async function fetchSettings() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/settings')
      if (res.data.status === 'ok' && res.data.settings) {
        setSettings(res.data.settings)
      } else {
        setError(res.data.message || 'Erro ao carregar configurações')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar configurações')
      console.error('Erro ao carregar configurações:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.put('/settings', settings)
      if (res.data.status === 'ok') {
        setSuccess('Configurações salvas com sucesso!')
        // Atualizar settings com a resposta do servidor
        if (res.data.settings) {
          setSettings(res.data.settings)
        }
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(res.data.message || 'Erro ao salvar configurações')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar configurações')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  // Verificar permissão - apenas OWNER e SUPER_ADMIN podem acessar
  if (currentUserRole !== 'OWNER' && currentUserRole !== 'SUPER_ADMIN') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso negado.</p>
          <p className="text-sm mt-1">Apenas Owners e Super Admins podem acessar as configurações do sistema.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Configurações do Sistema
          </h1>
          <p className="text-slate-600 mt-1">Gerencie as configurações gerais e avançadas do sistema</p>
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

      <div className="space-y-6">
        {/* Configurações Gerais */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiBuildingLine className="w-6 h-6 text-cyan-600" />
            Configurações Gerais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                placeholder="Nome da Empresa"
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email de Suporte
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email de Suporte"
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Máximo de Usuários por Família
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="number"
                  placeholder="Máximo de Usuários"
                  value={settings.maxUsersPerfamily}
                  onChange={e => setSettings({ ...settings, maxUsersPerfamily: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Dias de Trial
              </label>
              <div className="relative">
                <RiCalendarLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="number"
                  placeholder="Dias de Trial"
                  value={settings.trialDays}
                  onChange={e => setSettings({ ...settings, trialDays: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Integrações */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiPlugLine className="w-6 h-6 text-cyan-600" />
            Integrações
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.enableWhatsAppIntegration}
                onChange={e => setSettings({ ...settings, enableWhatsAppIntegration: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="block font-medium text-slate-800 group-hover:text-cyan-700 transition-colors">
                  Integração com WhatsApp
                </span>
                <span className="text-sm text-slate-600">Permitir notificações e mensagens via WhatsApp</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.enableGoogleIntegration}
                onChange={e => setSettings({ ...settings, enableGoogleIntegration: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="block font-medium text-slate-800 group-hover:text-cyan-700 transition-colors">
                  Integração com Google (Calendar, Tasks)
                </span>
                <span className="text-sm text-slate-600">Sincronizar compromissos e tarefas com Google</span>
              </div>
            </label>
          </div>
        </div>

        {/* Configurações do Stripe */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiPlugLine className="w-6 h-6 text-cyan-600" />
            Configurações do Stripe
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Stripe Publishable Key
              </label>
              <input
                type="text"
                placeholder="pk_test_..."
                value={settings.stripePublishableKey || ''}
                onChange={e => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Chave pública do Stripe para o frontend</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Stripe Secret Key
              </label>
              <input
                type="password"
                placeholder="sk_test_..."
                value={settings.stripeSecretKey || ''}
                onChange={e => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Chave secreta do Stripe (nunca compartilhe)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Stripe Webhook Secret
              </label>
              <input
                type="password"
                placeholder="whsec_..."
                value={settings.stripeWebhookSecret || ''}
                onChange={e => setSettings({ ...settings, stripeWebhookSecret: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Secret para validar webhooks do Stripe</p>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiNotificationLine className="w-6 h-6 text-cyan-600" />
            Notificações
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.enableEmailNotifications}
                onChange={e => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="block font-medium text-slate-800 group-hover:text-cyan-700 transition-colors">
                  Notificações por Email
                </span>
                <span className="text-sm text-slate-600">Enviar notificações importantes por email</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.enableSMSNotifications}
                onChange={e => setSettings({ ...settings, enableSMSNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="block font-medium text-slate-800 group-hover:text-cyan-700 transition-colors">
                  Notificações por SMS
                </span>
                <span className="text-sm text-slate-600">Enviar notificações importantes por SMS</span>
              </div>
            </label>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiToolsLine className="w-6 h-6 text-cyan-600" />
            Configurações Avançadas
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-white rounded-xl border-2 border-red-200 hover:border-red-300 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="font-medium text-red-800 group-hover:text-red-900 transition-colors flex items-center gap-2">
                  <RiShieldLine className="w-4 h-4" />
                  Modo de Manutenção
                </span>
                <span className="text-sm text-red-600">Bloquear acesso ao sistema para manutenção</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gradient-to-br from-yellow-50 to-white rounded-xl border-2 border-yellow-200 hover:border-yellow-300 transition-all cursor-pointer group">
              <input
                type="checkbox"
                checked={settings.debugMode}
                onChange={e => setSettings({ ...settings, debugMode: e.target.checked })}
                className="w-5 h-5 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="font-medium text-yellow-800 group-hover:text-yellow-900 transition-colors flex items-center gap-2">
                  <RiBugLine className="w-4 h-4" />
                  Modo Debug
                </span>
                <span className="text-sm text-yellow-600">Ativar logs detalhados para desenvolvimento</span>
              </div>
            </label>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
            >
              <RiRefreshLine className="w-5 h-5" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <RiSaveLine className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
