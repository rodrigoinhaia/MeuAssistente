"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import {
  RiShieldUserLine,
  RiEditLine,
  RiDeleteBinLine,
  RiUserAddLine,
  RiSearchLine,
  RiFilterLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiMailLine,
  RiUserLine,
  RiCalendarLine,
  RiShieldStarLine,
  RiShieldCheckLine
} from 'react-icons/ri'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'SUPER_ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const currentUserId = (session?.user as any)?.id
  const currentUserRole = (session?.user as any)?.role
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState({
    search: '',
    role: '',
    status: '',
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status])

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/users')
      setUsers(res.data.users || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar usuários')
    }
    setLoading(false)
  }

  async function handleRoleChange(userId: string, newRole: User['role']) {
    setError('')
    setSuccess('')
    try {
      await apiClient.patch('/users', { userId, role: newRole })
      setSuccess('Papel do usuário atualizado com sucesso!')
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar papel do usuário')
    }
  }

  async function handleStatusChange(userId: string, newStatus: boolean) {
    setError('')
    setSuccess('')
    try {
      await apiClient.patch('/users', { userId, isActive: newStatus })
      setSuccess(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar status do usuário')
    }
  }

  function getRoleConfig(role: string) {
    switch (role) {
      case 'OWNER':
        return {
          color: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
          label: 'Proprietário',
          icon: <RiShieldStarLine className="w-4 h-4" />
        }
      case 'SUPER_ADMIN':
        return {
          color: 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200',
          label: 'Super Admin',
          icon: <RiShieldCheckLine className="w-4 h-4" />
        }
      case 'USER':
        return {
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Usuário',
          icon: <RiShieldUserLine className="w-4 h-4" />
        }
      default:
        return {
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          label: role,
          icon: <RiShieldUserLine className="w-4 h-4" />
        }
    }
  }

  // Usuários filtrados
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filter.search || 
      user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.search.toLowerCase())
    const matchesRole = !filter.role || user.role === filter.role
    const matchesStatus = !filter.status || 
      (filter.status === 'active' && user.isActive) ||
      (filter.status === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Estatísticas
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    owners: users.filter(u => u.role === 'OWNER').length,
    users: users.filter(u => u.role === 'USER').length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  // Verificar permissão
  if (currentUserRole !== 'OWNER' && currentUserRole !== 'SUPER_ADMIN') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso negado.</p>
          <p className="text-sm mt-1">Apenas Owners e Super Admins podem gerenciar usuários.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Usuários
          </h1>
          <p className="text-slate-600 mt-1">Gerencie os membros da sua família</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiShieldUserLine className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiCheckboxCircleLine className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Ativos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{stats.active}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiCloseCircleLine className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Inativos</span>
          </div>
          <p className="text-2xl font-bold text-red-800">{stats.inactive}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiShieldStarLine className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Proprietários</span>
          </div>
          <p className="text-2xl font-bold text-purple-800">{stats.owners}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiShieldCheckLine className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-700">Super Admins</span>
          </div>
          <p className="text-2xl font-bold text-cyan-800">{stats.superAdmins}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiUserLine className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Usuários</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.users}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <RiFilterLine className="text-slate-400 w-5 h-5" />
            <select
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">Todos os papéis</option>
              <option value="OWNER">Proprietário</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="USER">Usuário</option>
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {/* Lista de Usuários */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-slate-600">Nenhum usuário corresponde aos filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const roleConfig = getRoleConfig(user.role)
            const isCurrentUser = user.id === currentUserId
            const canEditRole = !isCurrentUser && user.role !== 'OWNER'
            const canEditStatus = !isCurrentUser && user.role !== 'OWNER'
            
            return (
              <div
                key={user.id}
                className={`bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 border-2 transition-all hover:shadow-lg group ${
                  user.isActive 
                    ? 'border-slate-200 hover:border-cyan-300' 
                    : 'border-slate-100 opacity-60'
                } ${isCurrentUser ? 'ring-2 ring-cyan-500/20' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      user.role === 'OWNER'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                        : user.role === 'SUPER_ADMIN'
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-500'
                        : 'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">{user.name}</h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <RiMailLine className="w-4 h-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${roleConfig.color}`}>
                          {roleConfig.icon}
                          {roleConfig.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {user.isActive ? (
                            <>
                              <RiCheckboxCircleLine className="w-3 h-3" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <RiCloseCircleLine className="w-3 h-3" />
                              Inativo
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data de criação */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-200">
                  <RiCalendarLine className="w-4 h-4" />
                  <span>Membro desde {format(new Date(user.createdAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  {canEditRole && (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="USER">Usuário</option>
                      {currentUserRole === 'SUPER_ADMIN' && (
                        <option value="SUPER_ADMIN">Super Admin</option>
                      )}
                    </select>
                  )}
                  {!canEditRole && (
                    <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                      {roleConfig.label}
                    </div>
                  )}
                  {canEditStatus && (
                    <button
                      onClick={() => handleStatusChange(user.id, !user.isActive)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        user.isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                    >
                      {user.isActive ? (
                        <>
                          <RiCloseCircleLine className="w-4 h-4 inline mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <RiCheckboxCircleLine className="w-4 h-4 inline mr-1" />
                          Ativar
                        </>
                      )}
                    </button>
                  )}
                  {!canEditStatus && (
                    <div className="px-4 py-2 rounded-lg text-sm text-slate-400 bg-slate-50 border border-slate-200">
                      {user.role === 'OWNER' ? 'Protegido' : 'Você'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
