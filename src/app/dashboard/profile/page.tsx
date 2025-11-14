'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import { 
  RiUserLine, 
  RiMailLine, 
  RiLockPasswordLine, 
  RiSaveLine, 
  RiCheckboxCircleLine, 
  RiCloseCircleLine,
  RiPhoneLine,
  RiImageAddLine,
  RiUserSettingsLine,
  RiCalendarLine,
  RiShieldCheckLine
} from 'react-icons/ri'
import Image from 'next/image'

interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar: string | null
  familyRole: string | null
  role: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

const FAMILY_ROLES = [
  { value: 'PAI', label: 'Pai' },
  { value: 'MAE', label: 'Mãe' },
  { value: 'FILHO', label: 'Filho' },
  { value: 'FILHA', label: 'Filha' },
  { value: 'OUTROS', label: 'Outros' },
]

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [familyRole, setFamilyRole] = useState<string>('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
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
        setName(userData.name || '')
        setEmail(userData.email || '')
        setPhone(userData.phone || '')
        setFamilyRole(userData.familyRole || '')
        setAvatar(userData.avatar || null)
        setAvatarPreview(userData.avatar || null)
      } else {
        setError(res.data.error || 'Erro ao carregar perfil')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar perfil')
    }
    setLoading(false)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setAvatarPreview(result)
      // Converter para base64 para enviar ao servidor
      setAvatar(result)
    }
    reader.readAsDataURL(file)
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

    // Validar telefone
    if (!phone.trim()) {
      setError('Telefone é obrigatório')
      setSaving(false)
      return
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setError('Telefone inválido')
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
        phone: phone.trim(),
        familyRole: familyRole || null,
        avatar: avatar || null,
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
            phone: res.data.user.phone,
          },
        })
        
        // Atualizar estado local
        setUser(res.data.user)
        setAvatarPreview(res.data.user.avatar || null)
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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
          Meu Perfil
        </h1>
        <p className="text-slate-600 mt-1">Gerencie suas informações pessoais e configurações</p>
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
        {/* Foto de Perfil */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiImageAddLine className="w-6 h-6 text-cyan-600" />
            Foto de Perfil
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Foto de perfil"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <RiUserLine className="w-16 h-16 text-cyan-500" />
                )}
              </div>
              {user?.isVerified && (
                <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1.5 border-4 border-white shadow-md">
                  <RiShieldCheckLine className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
              >
                <RiImageAddLine className="w-4 h-4" />
                {avatarPreview ? 'Alterar Foto' : 'Adicionar Foto'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <RiUserLine className="w-6 h-6 text-cyan-600" />
            Informações Pessoais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome Completo *
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
                E-mail *
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <RiPhoneLine className="w-4 h-4" />
                WhatsApp *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                required
                placeholder="(51) 99999-9999"
              />
              <p className="text-xs text-slate-500 mt-1">
                Número usado para verificação e notificações
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <RiUserSettingsLine className="w-4 h-4" />
                Classificação na Família
              </label>
              <select
                value={familyRole}
                onChange={(e) => setFamilyRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="">Selecione...</option>
                {FAMILY_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Informações do usuário (somente leitura) */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Papel no Sistema
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <RiCalendarLine className="w-4 h-4" />
                  Membro desde
                </label>
                <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
