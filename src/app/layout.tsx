import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from "./providers"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeuAssistente - Sistema de Gestão Financeira e Compromissos',
  description: 'Sistema multitenancy de assistente financeiro e de compromissos com agentes de IA',
  icons: {
    icon: '/logo-meuassistente.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 