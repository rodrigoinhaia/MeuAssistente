"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string
  priority: string
  status: string
  googleTaskId: string | null
  user: { name: string }
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await axios.get('/api/tasks')
      setTasks(res.data.tasks)
    } catch (err: any) {
      setError('Erro ao carregar tarefas')
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
      const res = await axios.post('/api/tasks', form)
      if (res.data.status === 'ok') {
        setSuccess('Tarefa criada com sucesso!')
        setShowForm(false)
        fetchTasks()
        setForm({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending' })
      } else {
        setError(res.data.message || 'Erro ao criar tarefa')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar tarefa')
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getPriorityText(priority: string) {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return priority
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'in_progress': return 'Em Progresso'
      case 'completed': return 'Concluída'
      default: return status
    }
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date()
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session) return <div>Você precisa estar autenticado.</div>

  return (
    <main className="flex justify-center items-start min-h-screen bg-gray-100 dark:bg-gray-900 py-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md p-6 text-gray-900 dark:text-white">
        <h1 className="text-xl font-bold mb-4">Tarefas</h1>
        <form className="flex gap-2 mb-4" onSubmit={handleSubmit}>
          <input name="title" value={form.title} onChange={handleChange} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white border dark:border-gray-700" placeholder="Adicionar uma tarefa..." required />
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white">Adicionar</button>
        </form>

        {error && <div className="text-red-600 mb-2 dark:text-red-400">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}

      {loading ? (
        <div>Carregando tarefas...</div>
      ) : tasks.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada.</div>
      ) : (
          <div>
            {/* Agrupamento por data (exemplo simplificado: Hoje, Amanhã, Outros) */}
            {['Hoje', 'Amanhã', 'Outros'].map(grupo => (
              <div key={grupo}>
                <div className="text-sm text-gray-400 mb-2 mt-4 first:mt-0">{grupo}</div>
                <ul>
                  {tasks.filter(task => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0);
                    const amanha = new Date(); amanha.setDate(hoje.getDate()+1); amanha.setHours(0,0,0,0);
                    if (!task.dueDate) return grupo==='Outros';
                    const dataTarefa = new Date(task.dueDate); dataTarefa.setHours(0,0,0,0);
                    if(grupo==='Hoje') return dataTarefa.getTime()===hoje.getTime();
                    if(grupo==='Amanhã') return dataTarefa.getTime()===amanha.getTime();
                    return grupo==='Outros' && dataTarefa.getTime()!==hoje.getTime() && dataTarefa.getTime()!==amanha.getTime();
                  }).map(task => (
                    <li key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 group">
                      <span className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0 group-hover:border-blue-400"></span>
                <div className="flex-1">
                        <span className="font-medium">{task.title}</span>
                        {task.description && <div className="text-xs text-gray-400">{task.description}</div>}
                  </div>
                      {task.dueDate && <span className="text-xs text-gray-400 ml-2">{new Date(task.dueDate).toLocaleDateString()}</span>}
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>{getPriorityText(task.priority)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>{getStatusText(task.status)}</span>
                      {/* Ações rápidas podem ser adicionadas aqui */}
                    </li>
                  ))}
                </ul>
            </div>
          ))}
        </div>
      )}
        </div>
    </main>
  )
} 