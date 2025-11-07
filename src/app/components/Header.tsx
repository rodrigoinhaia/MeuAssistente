'use client'

import { useSession, signOut } from 'next-auth/react'
import { RiMoonLine, RiUserLine } from 'react-icons/ri'


export default function Header() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900">
      <div className="h-full px-6 flex items-center justify-between">
        <div /> {/* Espaço para manter o justify-between */}
        
        <div className="flex items-center space-x-4">

          
          <div className="flex items-center">
            <div className="text-right mr-3">
              <p className="text-sm font-medium text-white">
                {session?.user?.name}
                {role && (
                  <span className="ml-2 text-xs text-cyan-400">
                    {role}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">{session?.user?.email}</p>
            </div>

            <div className="relative group">
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <RiUserLine className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 text-left"
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
