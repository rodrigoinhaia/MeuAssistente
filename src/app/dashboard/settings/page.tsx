"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // TODO: Implementar API para salvar configurações
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular API call
      setSuccess('Configurações salvas com sucesso!')
    } catch (err: any) {
      setError('Erro ao salvar configurações')
    }
    setLoading(false)
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session || !session.user || ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN')) return <div>Acesso restrito.</div>

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
        Configurações do Sistema
      </h1>
      
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {success && <div className="text-emerald-400 mb-4">{success}</div>}

      <div className="bg-white/5 border border-gray-800 rounded-xl p-6 space-y-8">
        {/* Configurações Gerais */}
        <div>
          <h2 className="text-xl font-medium text-white mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Configurações Gerais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                placeholder="Nome da Empresa"
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-gray-800 text-white rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email de Suporte
              </label>
              <input
                type="email"
                placeholder="Email de Suporte"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-gray-800 text-white rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Máximo de Usuários por Cliente
              </label>
              <input
                type="number"
                placeholder="Máximo de Usuários por Cliente"
                value={settings.maxUsersPerfamily}
                onChange={e => setSettings({ ...settings, maxUsersPerfamily: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-gray-800 text-white rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Dias de Trial
              </label>
              <input
                type="number"
                placeholder="Dias de Trial"
                value={settings.trialDays}
                onChange={e => setSettings({ ...settings, trialDays: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-gray-800 text-white rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Integrações */}
        <div>
          <h2 className="text-xl font-medium text-white mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Integrações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="whatsapp"
                checked={settings.enableWhatsAppIntegration}
                onChange={e => setSettings({ ...settings, enableWhatsAppIntegration: e.target.checked })}
                className="h-5 w-5 rounded border-gray-800 bg-white/5 text-cyan-400 focus:ring-0 focus:ring-offset-0 checked:bg-gradient-to-r from-cyan-400 to-emerald-400"
              />
              <label htmlFor="whatsapp" className="ml-3 block text-sm text-gray-300">
                Integração com WhatsApp
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="google"
                checked={settings.enableGoogleIntegration}
                onChange={e => setSettings({ ...settings, enableGoogleIntegration: e.target.checked })}
                className="h-5 w-5 rounded border-gray-800 bg-white/5 text-cyan-400 focus:ring-0 focus:ring-offset-0 checked:bg-gradient-to-r from-cyan-400 to-emerald-400"
              />
              <label htmlFor="google" className="ml-3 block text-sm text-gray-300">
                Integração com Google (Calendar, Tasks)
              </label>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div>
          <h2 className="text-xl font-medium text-white mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Notificações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email"
                checked={settings.enableEmailNotifications}
                onChange={e => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                className="h-5 w-5 rounded border-gray-800 bg-white/5 text-cyan-400 focus:ring-0 focus:ring-offset-0 checked:bg-gradient-to-r from-cyan-400 to-emerald-400"
              />
              <label htmlFor="email" className="ml-3 block text-sm text-gray-300">
                Notificações por Email
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sms"
                checked={settings.enableSMSNotifications}
                onChange={e => setSettings({ ...settings, enableSMSNotifications: e.target.checked })}
                className="h-5 w-5 rounded border-gray-800 bg-white/5 text-cyan-400 focus:ring-0 focus:ring-offset-0 checked:bg-gradient-to-r from-cyan-400 to-emerald-400"
              />
              <label htmlFor="sms" className="ml-3 block text-sm text-gray-300">
                Notificações por SMS
              </label>
            </div>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div>
          <h2 className="text-xl font-medium text-white mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Configurações Avançadas
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenance"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="h-5 w-5 rounded border-gray-800 bg-white/5 text-red-400 focus:ring-0 focus:ring-offset-0 checked:bg-gradient-to-r from-red-400 to-pink-400"
              />
              <label htmlFor="maintenance" className="ml-3 block text-sm text-gray-300">
                Modo de Manutenção
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="debug"
                checked={settings.debugMode}
                onChange={e => setSettings({ ...settings, debugMode: e.target.checked })}
                className="h-5 w-5 rounded border-gray-800 bg-white/5 text-yellow-400 focus:ring-0 focus:ring-offset-0 checked:bg-gradient-to-r from-yellow-400 to-amber-400"
              />
              <label htmlFor="debug" className="ml-3 block text-sm text-gray-300">
                Modo Debug
              </label>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/5 text-gray-300 border border-gray-800 rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-emerald-500/30 hover:border-cyan-500/50 transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </main>
  )
} 