/**
 * Script de teste para reenvio de OTP usando usuário real
 * Testa a funcionalidade de reenvio de código OTP com usuário do banco
 */

import { PrismaClient } from '@prisma/client'
import { createAndSendOTP } from '../src/lib/otp'

const prisma = new PrismaClient()

async function testResendOTPReal() {
  console.log('🧪 Teste de Reenvio de OTP (Usuário Real)\n')
  console.log('='.repeat(60))

  // Buscar um usuário real do banco
  const user = await prisma.user.findFirst({
    where: {
      phone: { not: null },
      phone: { not: '00000000000' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
    },
  })

  if (!user) {
    console.error('❌ Nenhum usuário com telefone encontrado no banco!')
    await prisma.$disconnect()
    process.exit(1)
  }

  console.log('\n👤 Usuário encontrado:')
  console.log('─'.repeat(60))
  console.log(`   Nome: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Telefone: ${user.phone}`)
  console.log(`   Verificado: ${user.isVerified ? '✅ Sim' : '❌ Não'}`)
  console.log('─'.repeat(60))

  // Verificar variáveis de ambiente
  const evolutionApiUrl = process.env.EVOLUTION_API_URL
  const evolutionApiKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME

  console.log('\n📋 Configuração das Variáveis de Ambiente:')
  console.log('─'.repeat(60))
  console.log(`EVOLUTION_API_URL: ${evolutionApiUrl || '❌ NÃO CONFIGURADO'}`)
  console.log(`EVOLUTION_API_KEY: ${evolutionApiKey ? '✅ Configurado (' + evolutionApiKey.substring(0, 10) + '...)' : '❌ NÃO CONFIGURADO'}`)
  console.log(`EVOLUTION_INSTANCE_NAME: ${evolutionInstance || '❌ NÃO CONFIGURADO'}`)
  console.log('─'.repeat(60))

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    console.error('\n❌ ERRO: Variáveis de ambiente não configuradas!')
    await prisma.$disconnect()
    process.exit(1)
  }

  console.log('\n📤 Preparando teste de criação e envio de OTP...')
  console.log('─'.repeat(60))
  console.log(`User ID: ${user.id}`)
  console.log(`Número de destino: ${user.phone}`)
  console.log('─'.repeat(60))

  console.log('\n🔄 Iniciando teste...\n')

  try {
    const startTime = Date.now()
    
    console.log('📡 Criando e enviando código OTP...')
    const code = await createAndSendOTP(user.id, user.phone!)

    const duration = Date.now() - startTime

    console.log('\n' + '='.repeat(60))
    console.log('✅ SUCESSO! Código OTP criado e enviado!')
    console.log(`📝 Código gerado: ${code}`)
    console.log(`⏱️  Tempo de resposta: ${duration}ms`)
    console.log('\n📱 Verifique o WhatsApp do número:', user.phone)
    console.log('='.repeat(60))
  } catch (error: any) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ ERRO CAPTURADO:')
    console.error('─'.repeat(60))
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    console.error('='.repeat(60))
    
    console.log('\n🔍 Possíveis causas:')
    console.log('   1. Instância do Evolution API não está conectada')
    console.log('   2. Número não está registrado na instância')
    console.log('   3. API Key inválida ou expirada')
    console.log('   4. URL da API incorreta')
    console.log('   5. Nome da instância incorreto')
    console.log('   6. Problemas de rede/firewall')
    console.log('   7. Evolution API está offline')
    console.log('   8. Telefone em formato inválido')
    
    await prisma.$disconnect()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar teste
testResendOTPReal()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal no teste:', error)
    process.exit(1)
  })

