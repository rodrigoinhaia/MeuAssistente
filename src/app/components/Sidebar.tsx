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
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col">
      <div className="flex items-center h-16 px-6">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          MeuAssistente
        </h1>
      </div>

      {/* Seletor de Contexto para SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="px-3 mb-4">
          <div className="bg-gray-800 rounded-lg p-2">
            <label className="block text-xs font-medium text-gray-400 mb-2 px-2">
              Modo de Visualização
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleContextChange('family')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adminContext === 'family'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <RiHomeLine className="w-4 h-4" />
                Família
              </button>
              <button
                onClick={() => handleContextChange('admin')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adminContext === 'admin'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <RiAdminLine className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 px-3 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 mb-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-cyan-400' : ''}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}