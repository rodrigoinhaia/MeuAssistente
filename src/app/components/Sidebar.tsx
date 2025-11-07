'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  RiDashboardLine,
  RiTeamLine,
  RiPriceTag3Line,
  RiFileListLine,
  RiMoneyDollarBoxLine,
  RiFileChartLine,
  RiSettings4Line,
  RiRadarLine,
  RiShieldUserLine,
  RiHomeLine,
  RiAdminLine
} from 'react-icons/ri'
import { getAdminContext, setAdminContext, type AdminContext } from '@/lib/context'

// Interface para as props do Sidebar
interface SidebarProps {
  userRole: string | undefined; // userRole pode ser undefined se a sessão não estiver carregada
}

// Definição dos itens do menu - Modo Família
const familyMenuItems = [
  { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { href: '/dashboard/users', icon: RiShieldUserLine, label: 'Usuários', roles: ['OWNER', 'SUPER_ADMIN'] },
  { href: '/dashboard/categories', icon: RiPriceTag3Line, label: 'Categorias' },
  { href: '/dashboard/transactions', icon: RiMoneyDollarBoxLine, label: 'Transações' },
  { href: '/dashboard/commitments', icon: RiFileChartLine, label: 'Compromissos' },
  { href: '/dashboard/tasks', icon: RiFileListLine, label: 'Tarefas' },
  { href: '/dashboard/integrations', icon: RiRadarLine, label: 'Integrações' },
  { href: '/dashboard/settings', icon: RiSettings4Line, label: 'Configurações' },
]

// Definição dos itens do menu - Modo Super Admin
const adminMenuItems = [
  { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard Admin' },
  { href: '/dashboard/clients', icon: RiTeamLine, label: 'Famílias' },
  { href: '/dashboard/plans', icon: RiPriceTag3Line, label: 'Planos' },
  { href: '/dashboard/subscriptions', icon: RiFileListLine, label: 'Assinaturas' },
  { href: '/dashboard/payments', icon: RiMoneyDollarBoxLine, label: 'Pagamentos' },
  { href: '/dashboard/reports', icon: RiFileChartLine, label: 'Relatórios' },
  { href: '/dashboard/n8n', icon: RiRadarLine, label: 'Monitoramento N8N' },
  { href: '/dashboard/settings', icon: RiSettings4Line, label: 'Configurações' },
]

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const [adminContext, setAdminContextState] = useState<AdminContext>('family')

  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      setAdminContextState(getAdminContext(userRole))
    }
  }, [userRole])

  const handleContextChange = (newContext: AdminContext) => {
    setAdminContext(newContext)
    setAdminContextState(newContext)
    // Recarregar a página para aplicar o novo contexto
    window.location.href = '/dashboard'
  }

  // Determina qual menu mostrar
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isAdminMode = isSuperAdmin && adminContext === 'admin'
  const menuItems = isAdminMode ? adminMenuItems : familyMenuItems

  // Filtra os itens do menu com base no userRole
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    if (isSuperAdmin && adminContext === 'family') {
      // SUPER_ADMIN em modo família pode acessar tudo que OWNER pode
      return item.roles.includes('OWNER') || item.roles.includes('SUPER_ADMIN')
    }
    return userRole && item.roles.includes(userRole)
  })

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/60 flex flex-col shadow-lg">
      <div className="flex items-center h-16 px-6 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
          MeuAssistente
        </h1>
      </div>

      {/* Seletor de Contexto para SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="px-3 mb-4 mt-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200/60 shadow-sm">
            <label className="block text-xs font-semibold text-slate-600 mb-2 px-1">
              Modo de Visualização
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleContextChange('family')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  adminContext === 'family'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <RiHomeLine className="w-4 h-4" />
                Família
              </button>
              <button
                onClick={() => handleContextChange('admin')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  adminContext === 'admin'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <RiAdminLine className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 mb-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 text-cyan-600 font-medium shadow-sm border border-cyan-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100/50'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                isActive ? 'text-cyan-500' : 'text-slate-400 group-hover:text-slate-600'
              }`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}