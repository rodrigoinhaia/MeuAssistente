"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import { 
  RiAddLine, 
  RiCheckboxCircleLine, 
  RiTimeLine, 
  RiFlagLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiFilterLine,
  RiCalendarLine,
  RiUserLine
} from 'react-icons/ri'

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  googleTaskId: string | null
  user: { name: string }
  createdAt: string
}

type ViewMode = 'list' | 'kanban'
type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed'
type FilterPriority = 'all' | 'low' | 'medium' | 'high'

export default function TasksPage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTasks()
    }
  }, [status])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await apiClient.get('/tasks')
      setTasks(res.data.tasks || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar tarefas')
    }
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const method = editingTask ? 'put' : 'post'
      const url = editingTask ? `/tasks/${editingTask.id}` : '/tasks'
      const res = await apiClient[method](url, form)
      
      if (res.data.status === 'ok') {
        setSuccess(editingTask ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!')
        setShowForm(false)
        setEditingTask(null)
        fetchTasks()
        setForm({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending' })
      } else {
        setError(res.data.message || 'Erro ao salvar tarefa')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar tarefa')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    
    try {
      const res = await apiClient.delete(`/tasks/${id}`)
      if (res.data.status === 'ok') {
        setSuccess('Tarefa excluída com sucesso!')
        fetchTasks()
      } else {
        setError(res.data.message || 'Erro ao excluir tarefa')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir tarefa')
    }
  }

  async function handleStatusChange(id: string, newStatus: 'pending' | 'in_progress' | 'completed') {
    try {
      const task = tasks.find(t => t.id === id)
      if (!task) return
      
      const res = await apiClient.put(`/tasks/${id}`, { ...task, status: newStatus })
      if (res.data.status === 'ok') {
        fetchTasks()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  function openEditForm(task: Task) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate.split('T')[0],
      priority: task.priority,
      status: task.status,
    })
    setShowForm(true)
  }

  function openNewForm() {
    setEditingTask(null)
    setForm({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending' })
    setShowForm(true)
  }

  function getPriorityConfig(priority: string) {
    switch (priority) {
      case 'high':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          icon: '🔴', 
          label: 'Alta',
          gradient: 'from-red-500 to-pink-500'
        }
      case 'medium':
        return { 
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
          icon: '🟡', 
          label: 'Média',
          gradient: 'from-yellow-500 to-orange-500'
        }
      case 'low':
        return { 
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          icon: '🟢', 
          label: 'Baixa',
          gradient: 'from-emerald-500 to-teal-500'
        }
      default:
        return { 
          color: 'bg-slate-100 text-slate-700 border-slate-200', 
          icon: '⚪', 
          label: priority,
          gradient: 'from-slate-500 to-slate-600'
        }
    }
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          label: 'Concluída',
          icon: '✓'
        }
      case 'in_progress':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          label: 'Em Progresso',
          icon: '⏳'
        }
      case 'pending':
        return { 
          color: 'bg-slate-100 text-slate-700 border-slate-200', 
          label: 'Pendente',
          icon: '○'
        }
      default:
        return { 
          color: 'bg-slate-100 text-slate-700 border-slate-200', 
          label: status,
          icon: '○'
        }
    }
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  function isToday(dueDate: string) {
    const today = new Date()
    const taskDate = new Date(dueDate)
    return today.toDateString() === taskDate.toDateString()
  }

  function isTomorrow(dueDate: string) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const taskDate = new Date(dueDate)
    return tomorrow.toDateString() === taskDate.toDateString()
  }

  function getDateLabel(dueDate: string) {
    if (isToday(dueDate)) return 'Hoje'
    if (isTomorrow(dueDate)) return 'Amanhã'
    if (isOverdue(dueDate)) return 'Atrasada'
    return new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Tarefas
          </h1>
          <p className="text-slate-600 mt-1">Organize e gerencie suas tarefas</p>
        </div>
        <button
          onClick={openNewForm}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium flex items-center gap-2"
        >
          <RiAddLine className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-2">
            <RiFilterLine className="text-slate-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Progresso</option>
              <option value="completed">Concluída</option>
            </select>
          </div>

          {/* Filtro Prioridade */}
          <div className="flex items-center gap-2">
            <RiFlagLine className="text-slate-400 w-5 h-5" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="all">Todas as prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>

          {/* Modo de Visualização */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Kanban
            </button>
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

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Visualização Kanban */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['pending', 'in_progress', 'completed'].map((statusKey) => {
            const statusConfig = getStatusConfig(statusKey)
            const statusTasks = tasksByStatus[statusKey as keyof typeof tasksByStatus]
            
            return (
              <div key={statusKey} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className={`p-4 border-b border-slate-200 bg-gradient-to-r ${statusConfig.color.split(' ')[0]} bg-opacity-10`}>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>{statusConfig.icon}</span>
                    {statusConfig.label}
                    <span className="ml-auto text-sm text-slate-500">({statusTasks.length})</span>
                  </h3>
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {statusTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Nenhuma tarefa {statusConfig.label.toLowerCase()}
                    </div>
                  ) : (
                    statusTasks.map((task) => {
                      const priorityConfig = getPriorityConfig(task.priority)
                      const isTaskOverdue = isOverdue(task.dueDate)
                      
                      return (
                        <div
                          key={task.id}
                          className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`font-semibold flex-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditForm(task)}
                                className="p-1.5 rounded-lg hover:bg-cyan-50 text-cyan-600 transition-colors"
                                title="Editar"
                              >
                                <RiEditLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Excluir"
                              >
                                <RiDeleteBinLine className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityConfig.color}`}>
                              {priorityConfig.icon} {priorityConfig.label}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                              isTaskOverdue 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : isToday(task.dueDate)
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              <RiCalendarLine className="w-3 h-3" />
                              {getDateLabel(task.dueDate)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                              <RiUserLine className="w-3 h-3" />
                              {task.user.name}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Visualização Lista */
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-slate-600 mb-6">Crie sua primeira tarefa para começar a organizar seu trabalho!</p>
              <button
                onClick={openNewForm}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                Criar Tarefa
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const priorityConfig = getPriorityConfig(task.priority)
              const statusConfig = getStatusConfig(task.status)
              const isTaskOverdue = isOverdue(task.dueDate)
              
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all group ${
                    task.status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleStatusChange(
                        task.id, 
                        task.status === 'completed' ? 'pending' : 'completed'
                      )}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-cyan-500 hover:bg-cyan-50'
                      }`}
                    >
                      {task.status === 'completed' && <RiCheckboxCircleLine className="w-4 h-4" />}
                    </button>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <button
                            onClick={() => openEditForm(task)}
                            className="p-2 rounded-lg hover:bg-cyan-50 text-cyan-600 transition-colors"
                            title="Editar"
                          >
                            <RiEditLine className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <RiDeleteBinLine className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-slate-600 mb-4">{task.description}</p>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityConfig.color} flex items-center gap-1`}>
                          <RiFlagLine className="w-3 h-3" />
                          {priorityConfig.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color} flex items-center gap-1`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          isTaskOverdue 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : isToday(task.dueDate)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <RiCalendarLine className="w-3 h-3" />
                          {getDateLabel(task.dueDate)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <RiUserLine className="w-3 h-3" />
                          {task.user.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Título *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Digite o título da tarefa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                  placeholder="Adicione uma descrição (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Vencimento *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridade</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingTask(null)
                  setForm({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending' })
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
