'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import { RiUserLine, RiMailLine, RiLockPasswordLine, RiSaveLine, RiCheckboxCircleLine, RiCloseCircleLine } from 'react-icons/ri'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/profile')
      if (res.data.status === 'ok') {
        const userData = res.data.user
        setUser(userData)
        setName(userData.name)
        setEmail(userData.email)
      } else {
        setError(res.data.error || 'Erro ao carregar perfil')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar perfil')
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    // Validações
    if (!name.trim()) {
      setError('Nome é obrigatório')
      setSaving(false)
      return
    }

    if (!email.trim()) {
      setError('E-mail é obrigatório')
      setSaving(false)
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('E-mail inválido')
      setSaving(false)
      return
    }

    // Se está alterando senha, validar
    if (newPassword) {
      if (!currentPassword) {
        setError('Senha atual é obrigatória para alterar a senha')
        setSaving(false)
        return
      }

      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres')
        setSaving(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem')
        setSaving(false)
        return
      }
    }

    try {
      const updateData: any = {
        name: name.trim(),
        email: email.trim(),
      }

      if (newPassword) {
        updateData.password = newPassword
        updateData.currentPassword = currentPassword
      }

      const res = await apiClient.patch('/profile', updateData)
      
      if (res.data.status === 'ok') {
        setSuccess('Perfil atualizado com sucesso!')
        
        // Limpar campos de senha
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Atualizar sessão do NextAuth
        await update({
          ...session,
          user: {
            ...session?.user,
            name: res.data.user.name,
            email: res.data.user.email,
          },
        })
        
        // Atualizar estado local
        setUser(res.data.user)
      } else {
        setError(res.data.error || 'Erro ao atualizar perfil')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
          Meu Perfil
        </h1>
        <p className="text-slate-600 mt-1">Gerencie suas informações pessoais e senha</p>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm flex items-center gap-2">
          <RiCloseCircleLine className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm flex items-center gap-2">
          <RiCheckboxCircleLine className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Pessoais */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiUserLine className="w-6 h-6 text-cyan-600" />
            Informações Pessoais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <RiMailLine className="w-4 h-4" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                required
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Informações do usuário (somente leitura) */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Papel
                </label>
                <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl">
                  {user?.role === 'OWNER' ? 'Proprietário' : user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Usuário'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <div className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 ${
                  user?.isActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {user?.isActive ? (
                    <>
                      <RiCheckboxCircleLine className="w-4 h-4" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <RiCloseCircleLine className="w-4 h-4" />
                      Inativo
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alteração de Senha */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiLockPasswordLine className="w-6 h-6 text-cyan-600" />
            Alterar Senha
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Senha Atual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="Digite sua senha atual (apenas se quiser alterar)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Deixe em branco se não quiser alterar a senha
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="Digite a nova senha novamente"
                minLength={6}
              />
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <RiSaveLine className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

