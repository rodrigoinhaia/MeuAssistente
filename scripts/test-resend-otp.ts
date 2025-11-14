/**
 * Script de teste para reenvio de OTP
 * Testa a funcionalidade de reenvio de código OTP
 */

import { createAndSendOTP } from '../src/lib/otp'

async function testResendOTP() {
  console.log('🧪 Teste de Reenvio de OTP\n')
  console.log('='.repeat(60))

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
    console.log('\n📝 Configure as seguintes variáveis no arquivo .env ou no EasyPanel:')
    console.log('   EVOLUTION_API_URL=https://sua-api-evolution.com')
    console.log('   EVOLUTION_API_KEY=sua-chave-api')
    console.log('   EVOLUTION_INSTANCE_NAME=nome-da-instancia')
    process.exit(1)
  }

  // Número de teste
  const testUserId = 'test-user-id-' + Date.now()
  const testPhone = '5551920014708'

  console.log('\n📤 Preparando teste de criação e envio de OTP...')
  console.log('─'.repeat(60))
  console.log(`User ID de teste: ${testUserId}`)
  console.log(`Número de destino: ${testPhone}`)
  console.log('─'.repeat(60))

  console.log('\n🔄 Iniciando teste...\n')

  try {
    const startTime = Date.now()
    
    console.log('📡 Criando e enviando código OTP...')
    const code = await createAndSendOTP(testUserId, testPhone)

    const duration = Date.now() - startTime

    console.log('\n' + '='.repeat(60))
    console.log('✅ SUCESSO! Código OTP criado e enviado!')
    console.log(`📝 Código gerado: ${code}`)
    console.log(`⏱️  Tempo de resposta: ${duration}ms`)
    console.log('\n📱 Verifique o WhatsApp do número:', testPhone)
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
    
    process.exit(1)
  }
}

// Executar teste
testResendOTP()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal no teste:', error)
    process.exit(1)
  })

