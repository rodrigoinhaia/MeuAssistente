"use client"

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiPriceTag3Line,
  RiArrowUpLine,
  RiArrowDownLine,
  RiSearchLine,
  RiFilterLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine
} from 'react-icons/ri'

interface Category {
  id: string
  name: string
  type: 'expense' | 'income'
  color: string
  icon?: string
  isActive: boolean
}

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as 'expense' | 'income',
    color: '#3B82F6',
    icon: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    type: '',
    search: '',
    activeOnly: true,
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories()
    }
  }, [status])

  async function fetchCategories() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/categories')
      setCategories(res.data.categories || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar categorias')
    }
    setLoading(false)
  }

  function openEditModal(cat: Category) {
    setEditId(cat.id)
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon || '',
    })
    setShowModal(true)
  }

  function openNewModal() {
    setEditId(null)
    setForm({
      name: '',
      type: 'expense',
      color: '#3B82F6',
      icon: '',
    })
    setShowModal(true)
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!form.name.trim()) {
      setError('O nome é obrigatório.')
      return
    }

    try {
      if (editId) {
        await apiClient.put(`/categories/${editId}`, form)
        setSuccess('Categoria atualizada com sucesso!')
      } else {
        await apiClient.post('/categories', form)
        setSuccess('Categoria criada com sucesso!')
      }
      
      setShowModal(false)
      setEditId(null)
      setForm({ name: '', type: 'expense', color: '#3B82F6', icon: '' })
      fetchCategories()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar categoria')
    }
  }

  async function handleDeleteCategory() {
    if (!deleteId) return
    
    try {
      await apiClient.delete(`/categories/${deleteId}`)
      setSuccess('Categoria excluída com sucesso!')
      setDeleteId(null)
      fetchCategories()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir categoria')
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      await apiClient.put(`/categories/${id}`, { isActive: !currentStatus })
      setSuccess(`Categoria ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`)
      fetchCategories()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao alterar status da categoria')
    }
  }

  // Categorias filtradas
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchesSearch = !filter.search || cat.name.toLowerCase().includes(filter.search.toLowerCase())
      const matchesType = !filter.type || cat.type === filter.type
      const matchesActive = !filter.activeOnly || cat.isActive
      return matchesSearch && matchesType && matchesActive
    })
  }, [categories, filter])

  // Estatísticas
  const stats = useMemo(() => {
    const expenses = categories.filter(c => c.type === 'expense').length
    const income = categories.filter(c => c.type === 'income').length
    const active = categories.filter(c => c.isActive).length
    const inactive = categories.filter(c => !c.isActive).length

    return { expenses, income, active, inactive, total: categories.length }
  }, [categories])

  // Cores predefinidas para facilitar seleção
  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#A855F7', '#F43F5E', '#22C55E', '#EAB308'
  ]

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
            Categorias
          </h1>
          <p className="text-slate-600 mt-1">Organize suas receitas e despesas por categorias</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium flex items-center gap-2"
        >
          <RiAddLine className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiPriceTag3Line className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiArrowDownLine className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-800">{stats.expenses}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiArrowUpLine className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{stats.income}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiCheckboxCircleLine className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-700">Ativas</span>
          </div>
          <p className="text-2xl font-bold text-cyan-800">{stats.active}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RiCloseCircleLine className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Inativas</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.inactive}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <RiFilterLine className="text-slate-400 w-5 h-5" />
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="">Todos os tipos</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.activeOnly}
                onChange={(e) => setFilter({ ...filter, activeOnly: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
              />
              Apenas ativas
            </label>
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

      {/* Grid de Categorias */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-slate-600 mb-6">Crie sua primeira categoria para começar!</p>
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
          >
            Criar Categoria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map(cat => {
            const isExpense = cat.type === 'expense'
            
            return (
              <div
                key={cat.id}
                className={`bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 border-2 transition-all hover:shadow-lg group ${
                  cat.isActive 
                    ? 'border-slate-200 hover:border-cyan-300' 
                    : 'border-slate-100 opacity-60'
                }`}
                style={{
                  borderLeftColor: cat.color,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {isExpense ? (
                        <RiArrowDownLine className="w-6 h-6" style={{ color: cat.color }} />
                      ) : (
                        <RiArrowUpLine className="w-6 h-6" style={{ color: cat.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isExpense ? 'Despesa' : 'Receita'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleActive(cat.id, cat.isActive)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        cat.isActive
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      }`}
                      title={cat.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {cat.isActive ? (
                        <RiCloseCircleLine className="w-4 h-4" />
                      ) : (
                        <RiCheckboxCircleLine className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors"
                      title="Editar"
                    >
                      <RiEditLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Excluir"
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-slate-500 font-mono">{cat.color}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cat.isActive
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {cat.isActive ? 'Ativa' : 'Inativa'}
                  </span>
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
            onSubmit={handleSaveCategory}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {editId ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Digite o nome da categoria"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'expense' | 'income' })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cor *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-16 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        form.color === color ? 'border-slate-800 scale-110' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ícone (opcional)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Ex: fa-solid fa-car"
                />
                <p className="text-xs text-slate-500 mt-1">Código do ícone (Font Awesome, etc.)</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditId(null)
                  setForm({ name: '', type: 'expense', color: '#3B82F6', icon: '' })
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                {editId ? 'Salvar Alterações' : 'Criar Categoria'}
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
            <p className="text-slate-600">Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCategory}
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
