'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { RiMoonLine, RiUserLine, RiSettings3Line } from 'react-icons/ri'


export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <div /> {/* Espaço para manter o justify-between */}
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="text-right mr-3">
              <p className="text-sm font-semibold text-slate-800">
                {session?.user?.name}
                {role && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-600 border border-cyan-200/50">
                    {role}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">{session?.user?.email}</p>
            </div>

            <div className="relative group">
              <button className="p-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                <RiUserLine className="w-5 h-5 text-slate-600" />
              </button>
              
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-xl shadow-xl border border-slate-200/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all backdrop-blur-sm z-50">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 text-left rounded-lg transition-colors flex items-center gap-2"
                >
                  <RiSettings3Line className="w-4 h-4" />
                  Meu Perfil
                </button>
                <div className="border-t border-slate-200 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 text-left rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
