/**
 * Script para verificar status da instância Evolution API
 * Verifica se a instância está conectada e funcionando
 */

async function checkEvolutionInstance() {
  console.log('🔍 Verificando Status da Instância Evolution API\n')
  console.log('='.repeat(60))

  const evolutionApiUrl = process.env.EVOLUTION_API_URL
  const evolutionApiKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    console.error('❌ Variáveis de ambiente não configuradas!')
    process.exit(1)
  }

  console.log('📋 Configuração:')
  console.log(`   URL: ${evolutionApiUrl}`)
  console.log(`   Instância: ${evolutionInstance}`)
  console.log(`   API Key: ${evolutionApiKey.substring(0, 10)}...`)
  console.log('')

  try {
    // Verificar status da instância
    console.log('1️⃣ Verificando status da instância...')
    const statusUrl = `${evolutionApiUrl.replace(/\/$/, '')}/instance/fetchInstances`
    console.log(`   URL: ${statusUrl}`)
    
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json',
      },
    })

    if (statusResponse.ok) {
      const instances = await statusResponse.json()
      console.log('   ✅ Resposta recebida')
      console.log('   Instâncias encontradas:', Array.isArray(instances) ? instances.length : 'N/A')
      
      const instance = Array.isArray(instances) 
        ? instances.find((inst: any) => inst.instance?.instanceName === evolutionInstance)
        : null
      
      if (instance) {
        console.log('\n📊 Status da Instância:')
        console.log('─'.repeat(60))
        console.log(`   Nome: ${instance.instance?.instanceName || 'N/A'}`)
        console.log(`   Status: ${instance.instance?.status || 'N/A'}`)
        console.log(`   Estado: ${instance.instance?.state || 'N/A'}`)
        console.log(`   Conectado: ${instance.instance?.status === 'open' ? '✅ Sim' : '❌ Não'}`)
        console.log('─'.repeat(60))
        
        if (instance.instance?.status !== 'open') {
          console.error('\n⚠️  ATENÇÃO: A instância não está conectada!')
          console.log('   Status:', instance.instance?.status)
          console.log('   Estado:', instance.instance?.state)
          console.log('\n   Para conectar a instância, você precisa:')
          console.log('   1. Acessar o painel da Evolution API')
          console.log('   2. Conectar o WhatsApp Web')
          console.log('   3. Aguardar o status mudar para "open"')
        }
      } else {
        console.error(`\n❌ Instância "${evolutionInstance}" não encontrada!`)
        console.log('   Instâncias disponíveis:')
        if (Array.isArray(instances)) {
          instances.forEach((inst: any) => {
            console.log(`   - ${inst.instance?.instanceName || 'N/A'}`)
          })
        }
      }
    } else {
      const errorText = await statusResponse.text()
      console.error(`❌ Erro ao verificar status: ${statusResponse.status}`)
      console.error(`   Resposta: ${errorText}`)
    }

    // Verificar se consegue enviar mensagem de teste
    console.log('\n2️⃣ Testando envio de mensagem...')
    const testPhone = '5551920014708'
    const testMessage = `🧪 Teste de conexão - ${new Date().toLocaleString('pt-BR')}`
    
    const sendUrl = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstance}`
    console.log(`   URL: ${sendUrl}`)
    console.log(`   Número: ${testPhone}`)
    
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: testPhone,
        text: testMessage,
      }),
    })

    if (sendResponse.ok) {
      const sendData = await sendResponse.json()
      console.log('   ✅ Mensagem aceita pela API')
      console.log('   Status:', sendData.status || 'N/A')
      console.log('   Message ID:', sendData.key?.id || 'N/A')
      
      if (sendData.status === 'PENDING') {
        console.log('\n   ⚠️  Status PENDING - A mensagem foi aceita mas ainda não foi entregue')
        console.log('   Isso pode significar:')
        console.log('   - O número não está na lista de contatos da instância')
        console.log('   - A instância está processando a mensagem')
        console.log('   - O WhatsApp precisa sincronizar')
      } else if (sendData.status === 'FAILED') {
        console.error('\n   ❌ Status FAILED - A mensagem falhou ao ser enviada')
        console.log('   Verifique se o número está registrado na instância')
      }
    } else {
      const errorData = await sendResponse.json().catch(async () => ({ message: await sendResponse.text() }))
      console.error(`   ❌ Erro ao enviar: ${sendResponse.status}`)
      console.error(`   Resposta:`, errorData)
    }

  } catch (error: any) {
    console.error('\n❌ Erro ao verificar instância:', error.message)
    console.error('   Stack:', error.stack)
  }
}

checkEvolutionInstance()
  .then(() => {
    console.log('\n✅ Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

