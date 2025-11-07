'use client'

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
  RiShieldUserLine
} from 'react-icons/ri'

// Interface para as props do Sidebar
interface SidebarProps {
  userRole: string | undefined; // userRole pode ser undefined se a sessão não estiver carregada
}

// Definição dos itens do menu
const allMenuItems = [
  { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { href: '/dashboard/users', icon: RiShieldUserLine, label: 'Usuários', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/clients', icon: RiTeamLine, label: 'Clientes', roles: ['SUPER_ADMIN'] },
  { href: '/dashboard/plans', icon: RiPriceTag3Line, label: 'Planos', roles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
  { href: '/dashboard/subscriptions', icon: RiFileListLine, label: 'Assinaturas', roles: ['SUPER_ADMIN', 'OWNER', 'ADMIN'] },
  { href: '/dashboard/payments', icon: RiMoneyDollarBoxLine, label: 'Pagamentos' },
  { href: '/dashboard/reports', icon: RiFileChartLine, label: 'Relatórios' },
  { href: '/dashboard/settings', icon: RiSettings4Line, label: 'Configurações' },
  { href: '/dashboard/n8n', icon: RiRadarLine, label: 'Monitoramento N8N', roles: ['SUPER_ADMIN'] }
]

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  // Filtra os itens do menu com base no userRole
  const menuItems = allMenuItems.filter(item => !item.roles || (userRole && item.roles.includes(userRole)))

  return (
    <aside className="w-64 min-h-screen bg-gray-900">
      <div className="flex items-center h-16 px-6">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          MeuAssistente
        </h1>
      </div>
      
      <nav className="mt-4 px-3">
        {menuItems.map((item) => {
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