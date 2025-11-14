'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import OTPVerificationModal from './OTPVerificationModal'
import { RiShieldCheckLine, RiCloseLine, RiAlertLine } from 'react-icons/ri'

export default function VerificationBanner() {
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Verificar se o usuário está realmente verificado
  // isVerified deve ser explicitamente true, não apenas "não false"
  const isVerified = (session?.user as any)?.isVerified === true

  // Se estiver verificado ou já foi dispensado, não mostrar
  if (isVerified || dismissed) {
    return null
  }
  
  // Log para debug
  console.log('[VerificationBanner] Status:', {
    isVerified: (session?.user as any)?.isVerified,
    isVerifiedStrict: isVerified,
    dismissed,
    email: (session?.user as any)?.email,
    phone: (session?.user as any)?.phone,
  })

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <RiAlertLine className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Verifique seu WhatsApp
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                Para garantir a segurança da sua conta, verifique seu número de WhatsApp cadastrado.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all flex items-center gap-2"
              >
                <RiShieldCheckLine className="w-4 h-4" />
                Verificar Agora
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
            title="Dispensar"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      <OTPVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false)
          setDismissed(true)
          // Atualizar sessão para refletir verificação
          window.location.reload()
        }}
        phoneNumber={(session?.user as any)?.phone}
        userEmail={(session?.user as any)?.email}
        isPublic={false} // Usuário já está autenticado
      />
    </>
  )
}

