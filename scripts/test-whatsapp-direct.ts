/**
 * Script de teste direto para envio de mensagem via WhatsApp
 * Testa o envio para um número específico e mostra logs detalhados
 * Uso: npx tsx scripts/test-whatsapp-direct.ts
 */

import { sendWhatsAppMessage } from '../src/lib/whatsapp/send-message'

async function testWhatsAppDirect() {
  console.log('🧪 Teste de Envio WhatsApp - Monitoramento Detalhado\n')
  console.log('=' .repeat(60))

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
  const testPhone = '5551920014708'
  const testMessage = `🧪 *Teste MeuAssistente*\n\nEsta é uma mensagem de teste enviada em ${new Date().toLocaleString('pt-BR')}.\n\nSe você recebeu esta mensagem, o sistema está funcionando corretamente! ✅`

  console.log('\n📤 Preparando envio de mensagem...')
  console.log('─'.repeat(60))
  console.log(`Número de destino: ${testPhone}`)
  console.log(`Mensagem: ${testMessage.substring(0, 80)}...`)
  console.log(`URL da API: ${evolutionApiUrl}/message/sendText/${evolutionInstance}`)
  console.log('─'.repeat(60))

  console.log('\n🔄 Iniciando requisição...\n')

  try {
    const startTime = Date.now()
    
    console.log('📡 Fazendo requisição HTTP...')
    const result = await sendWhatsAppMessage({
      phoneNumber: testPhone,
      message: testMessage,
    })

    const duration = Date.now() - startTime

    console.log('\n' + '='.repeat(60))
    if (result) {
      console.log('✅ SUCESSO! Mensagem enviada com sucesso!')
      console.log(`⏱️  Tempo de resposta: ${duration}ms`)
      console.log('\n📱 Verifique o WhatsApp do número:', testPhone)
    } else {
      console.error('❌ FALHA! Mensagem não foi enviada')
      console.log(`⏱️  Tempo de resposta: ${duration}ms`)
    }
    console.log('='.repeat(60))
  } catch (error: any) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ ERRO CAPTURADO:')
    console.error('─'.repeat(60))
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    
    if (error.response) {
      console.error('\n📡 Detalhes da Resposta HTTP:')
      console.error('─'.repeat(60))
      console.error('Status:', error.response.status)
      console.error('Status Text:', error.response.statusText)
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2))
      console.error('Data:', JSON.stringify(error.response.data, null, 2))
    }
    
    if (error.request) {
      console.error('\n📡 Detalhes da Requisição:')
      console.error('─'.repeat(60))
      console.error('Request:', error.request)
    }
    
    console.error('='.repeat(60))
    
    console.log('\n🔍 Possíveis causas:')
    console.log('   1. Instância do Evolution API não está conectada')
    console.log('   2. Número não está registrado na instância')
    console.log('   3. API Key inválida ou expirada')
    console.log('   4. URL da API incorreta')
    console.log('   5. Nome da instância incorreto')
    console.log('   6. Problemas de rede/firewall')
    console.log('   7. Evolution API está offline')
    
    process.exit(1)
  }
}

// Executar teste
testWhatsAppDirect()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal no teste:', error)
    process.exit(1)
  })

