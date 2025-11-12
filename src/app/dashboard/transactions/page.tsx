"use client"

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { saveAs } from 'file-saver'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiMoneyDollarBoxLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiSearchLine,
  RiFilterLine,
  RiDownloadLine,
  RiUserLine,
  RiCalendarLine,
  RiPriceTag3Line,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiUploadLine
} from 'react-icons/ri'

interface Transaction {
  id: string
  date: string
  description: string
  amount: string
  type: 'expense' | 'income'
  status: 'pending' | 'paid' | 'overdue'
  category?: { id: string; name: string; color: string }
  user?: { id: string; name: string; email: string }
}

interface Category {
  id: string
  name: string
  type: string
  color: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const userRole = (session?.user as any)?.role || 'USER'
  const currentUserId = (session?.user as any)?.id
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    categoryId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending' as 'pending' | 'paid' | 'overdue',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    type: '',
    categoryId: '',
    userId: '',
    search: '',
    status: '',
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions()
      fetchCategories()
      if (userRole === 'OWNER') {
        fetchUsers()
      }
    }
  }, [status, filter, userRole])

  async function fetchTransactions() {
    setLoading(true)
    setError('')
    try {
      const params: any = {}
      if (filter.startDate) params.startDate = filter.startDate
      if (filter.endDate) params.endDate = filter.endDate
      if (filter.type) params.type = filter.type
      if (filter.categoryId) params.categoryId = filter.categoryId
      if (filter.userId) params.userId = filter.userId
      if (filter.search) params.search = filter.search
      if (filter.status) params.status = filter.status
      
      const res = await apiClient.get('/transactions', { params })
      if (res.data.status === 'ok') {
        setTransactions(res.data.transactions || [])
      } else {
        setError(res.data.message || res.data.error || 'Erro ao carregar transações')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar transações')
    }
    setLoading(false)
  }

  async function fetchCategories() {
    try {
      const res = await apiClient.get('/categories')
      setCategories(res.data.categories || [])
    } catch (err) {
      // Ignorar erro
    }
  }

  async function fetchUsers() {
    try {
      const res = await apiClient.get('/users')
      setUsers(res.data.users || [])
    } catch (err) {
      // Ignorar erro
    }
  }

  function openEditModal(tx: Transaction) {
    setEditId(tx.id)
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      categoryId: tx.category?.id || '',
      date: format(new Date(tx.date), 'yyyy-MM-dd'),
      status: tx.status,
    })
    setShowModal(true)
  }

  function openNewModal() {
    setEditId(null)
    setForm({
      description: '',
      amount: '',
      type: 'expense',
      categoryId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
    })
    setShowModal(true)
  }

  async function handleSaveTransaction(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!form.description.trim() || !form.amount || !form.categoryId || !form.date) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      const payload = {
        ...form,
        amount: Number(form.amount.replace(',', '.')),
      }

      if (editId) {
        await apiClient.put(`/transactions/${editId}`, payload)
        setSuccess('Transação atualizada com sucesso!')
      } else {
        await apiClient.post('/transactions', payload)
        setSuccess('Transação criada com sucesso!')
      }
      
      setShowModal(false)
      setEditId(null)
      setForm({ description: '', amount: '', type: 'expense', categoryId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' })
      fetchTransactions()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar transação')
    }
  }

  async function handleDeleteTransaction() {
    if (!deleteId) return
    
    try {
      await apiClient.delete(`/transactions/${deleteId}`)
      setSuccess('Transação excluída com sucesso!')
      setDeleteId(null)
      fetchTransactions()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir transação')
    }
  }

  function exportToCSV() {
    const header = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Responsável']
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString('pt-BR'),
      tx.description,
      tx.category ? tx.category.name : '-',
      tx.type === 'expense' ? 'Despesa' : 'Receita',
      (typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount)).toFixed(2).replace('.', ','),
      tx.status === 'paid' ? 'Paga' : tx.status === 'overdue' ? 'Vencida' : 'Pendente',
      tx.user?.name || '-',
    ])
    const csv = [header, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `transacoes-${new Date().toISOString().slice(0,10)}.csv`)
  }

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0)
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0)
    const balance = income - expenses
    const pending = transactions.filter(t => t.status === 'pending').length
    const overdue = transactions.filter(t => t.status === 'overdue').length

    return { expenses, income, balance, pending, overdue }
  }, [transactions])

  function getStatusConfig(status: string) {
    switch (status) {
      case 'paid':
        return { 
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          label: 'Paga',
          icon: <RiCheckboxCircleLine className="w-4 h-4" />
        }
      case 'overdue':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          label: 'Vencida',
          icon: <RiCloseCircleLine className="w-4 h-4" />
        }
      case 'pending':
        return { 
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
          label: 'Pendente',
          icon: <RiTimeLine className="w-4 h-4" />
        }
      default:
        return { 
          color: 'bg-slate-100 text-slate-700 border-slate-200', 
          label: status,
          icon: <RiTimeLine className="w-4 h-4" />
        }
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Transações
          </h1>
          <p className="text-slate-600 mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/dashboard/integrations?import=true'}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium flex items-center gap-2 shadow-sm"
            title="Importar extrato bancário (OFX/CSV)"
          >
            <RiUploadLine className="w-5 h-5" />
            <span className="hidden md:inline">Importar Extrato</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={transactions.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiDownloadLine className="w-5 h-5" />
            <span className="hidden md:inline">Exportar CSV</span>
          </button>
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium flex items-center gap-2"
          >
            <RiAddLine className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiArrowUpLine className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800">R$ {stats.income.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiArrowDownLine className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-800">R$ {stats.expenses.toFixed(2)}</p>
        </div>
        <div className={`bg-gradient-to-br rounded-xl p-4 border shadow-sm ${
          stats.balance >= 0 
            ? 'from-cyan-50 to-cyan-100 border-cyan-200' 
            : 'from-orange-50 to-orange-100 border-orange-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <RiMoneyDollarBoxLine className={`w-5 h-5 ${stats.balance >= 0 ? 'text-cyan-600' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${stats.balance >= 0 ? 'text-cyan-700' : 'text-orange-700'}`}>Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-cyan-800' : 'text-orange-800'}`}>
            R$ {stats.balance.toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiTimeLine className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiCloseCircleLine className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Vencidas</span>
          </div>
          <p className="text-2xl font-bold text-red-800">{stats.overdue}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
              placeholder="Data inicial"
            />
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
              placeholder="Data final"
            />
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value, categoryId: '' })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
            <select
              value={filter.categoryId}
              onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories
                .filter(cat => !filter.type || cat.type === filter.type)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
            {userRole === 'OWNER' && (
              <select
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
              >
                <option value="">Todos os membros</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            )}
            {userRole === 'OWNER' && (
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Paga</option>
                <option value="overdue">Vencida</option>
              </select>
            )}
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

      {/* Lista de Transações */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma transação encontrada</h3>
          <p className="text-slate-600 mb-6">Crie sua primeira transação para começar!</p>
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
          >
            Criar Transação
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => {
            const canEdit = userRole === 'OWNER' || (userRole === 'USER' && tx.user?.id === currentUserId)
            const statusConfig = getStatusConfig(tx.status)
            const isExpense = tx.type === 'expense'
            
            return (
              <div
                key={tx.id}
                className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Ícone de tipo */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isExpense 
                        ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-600' 
                        : 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600'
                    }`}>
                      {isExpense ? (
                        <RiArrowDownLine className="w-6 h-6" />
                      ) : (
                        <RiArrowUpLine className="w-6 h-6" />
                      )}
                    </div>

                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800 truncate">{tx.description}</h3>
                        {tx.category && (
                          <span 
                            className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5"
                            style={{ 
                              backgroundColor: `${tx.category.color}20`,
                              color: tx.category.color,
                              borderColor: `${tx.category.color}40`
                            }}
                          >
                            <RiPriceTag3Line className="w-3 h-3" />
                            {tx.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                          <RiCalendarLine className="w-4 h-4" />
                          {format(new Date(tx.date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        {tx.user && (
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            <RiUserLine className="w-4 h-4" />
                            {tx.user.name}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="flex-shrink-0 text-right ml-4">
                      <p className={`text-xl font-bold ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isExpense ? '-' : '+'} R$ {(typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount)).toFixed(2)}
                      </p>
                    </div>

                    {/* Ações */}
                    {canEdit && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-transparent hover:border-cyan-200 transition-colors"
                          title="Editar"
                        >
                          <RiEditLine className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 transition-colors"
                          title="Excluir"
                        >
                          <RiDeleteBinLine className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveTransaction}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {editId ? 'Editar Transação' : 'Nova Transação'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Digite a descrição"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'expense' | 'income', categoryId: '' })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  >
                    <option value="">Selecione</option>
                    {categories.filter(c => c.type === form.type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'pending' | 'paid' | 'overdue' })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Paga</option>
                    <option value="overdue">Vencida</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditId(null)
                  setForm({ description: '', amount: '', type: 'expense', categoryId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' })
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                {editId ? 'Salvar Alterações' : 'Criar Transação'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-slate-200/60 space-y-6">
            <h2 className="text-xl font-bold text-red-700">Confirmar Exclusão</h2>
            <p className="text-slate-600">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
