/**
 * Script para atualizar o workflow N8N e adicionar integração com o sistema
 * 
 * Uso: npx tsx scripts/update-n8n-workflow.ts
 */

import { N8NService } from '@/lib/n8n'

const WORKFLOW_ID = 'jydoDAnOVojEGX0D'
const SYSTEM_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || ''

async function updateWorkflow() {
  try {
    const n8nService = new N8NService()
    
    // Configurar serviço com variáveis de ambiente
    const n8nUrl = process.env.N8N_BASE_URL || process.env.N8N_API_URL
    const n8nApiKey = process.env.N8N_API_KEY
    
    if (!n8nUrl || !n8nApiKey) {
      console.error('❌ Variáveis de ambiente não configuradas:')
      console.error('   N8N_BASE_URL ou N8N_API_URL')
      console.error('   N8N_API_KEY')
      process.exit(1)
    }
    
    n8nService.setConfig({
      url: n8nUrl,
      apiKey: n8nApiKey,
    })
    
    // Buscar workflow atual
    const workflow = await n8nService.getWorkflow(WORKFLOW_ID)
    
    if (!workflow) {
      console.error('Workflow não encontrado')
      return
    }

    console.log('Workflow encontrado:', workflow.name)
    console.log('Total de nós:', workflow.nodes.length)

    // Encontrar o nó "Edit Fields" (que extrai telefoneCliente, mensagem, etc.)
    const editFieldsNode = workflow.nodes.find(
      (node: any) => node.name === 'Edit Fields' && node.parameters?.assignments?.assignments?.some(
        (a: any) => a.name === 'telefoneCliente'
      )
    )

    if (!editFieldsNode) {
      console.error('Nó "Edit Fields" não encontrado')
      return
    }

    console.log('Nó "Edit Fields" encontrado:', editFieldsNode.id)

    // Criar novo nó HTTP Request para processar mensagem
    const processMessageNode = {
      id: `process-message-${Date.now()}`,
      name: 'Processar Mensagem - Sistema',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [
        (editFieldsNode.position[0] || 0) + 400,
        editFieldsNode.position[1] || 0,
      ],
      parameters: {
        method: 'POST',
        url: `${SYSTEM_URL}/api/webhooks/whatsapp`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'Authorization',
              value: `Bearer ${WEBHOOK_SECRET}`,
            },
            {
              name: 'Content-Type',
              value: 'application/json',
            },
          ],
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'phoneNumber',
              value: "={{ $json.telefoneCliente }}",
            },
            {
              name: 'message',
              value: "={{ $json.mensagem }}",
            },
            {
              name: 'messageType',
              value: "={{ $json.tipoMensagem || 'text' }}",
            },
          ],
        },
        options: {},
      },
    }

    // Criar nó IF para verificar se precisa confirmação
    const checkConfirmationNode = {
      id: `check-confirmation-${Date.now()}`,
      name: 'Verificar Confirmação',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [
        (processMessageNode.position[0] || 0) + 400,
        processMessageNode.position[1] || 0,
      ],
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
            version: 2,
          },
          conditions: [
            {
              id: `condition-${Date.now()}`,
              leftValue: "={{ $json.requiresConfirmation }}",
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'equals',
              },
            },
          ],
          combinator: 'and',
        },
        options: {},
      },
    }

    // Adicionar nós ao workflow
    workflow.nodes.push(processMessageNode, checkConfirmationNode)

    // Atualizar conexões
    // Encontrar conexões que saem do "Edit Fields"
    const connections = workflow.connections || {}
    
    // Criar nova conexão: Edit Fields → Processar Mensagem
    // N8N API espera conexões indexadas por nome do nó, não ID
    if (!connections[editFieldsNode.name]) {
      connections[editFieldsNode.name] = {}
    }
    if (!connections[editFieldsNode.name].main) {
      connections[editFieldsNode.name].main = []
    }
    if (!connections[editFieldsNode.name].main[0]) {
      connections[editFieldsNode.name].main[0] = []
    }
    
    connections[editFieldsNode.name].main[0].push({
      node: processMessageNode.name,
      type: 'main',
      index: 0,
    })

    // Criar conexão: Processar Mensagem → Verificar Confirmação
    if (!connections[processMessageNode.name]) {
      connections[processMessageNode.name] = {}
    }
    if (!connections[processMessageNode.name].main) {
      connections[processMessageNode.name].main = []
    }
    if (!connections[processMessageNode.name].main[0]) {
      connections[processMessageNode.name].main[0] = []
    }
    
    connections[processMessageNode.name].main[0].push({
      node: checkConfirmationNode.name,
      type: 'main',
      index: 0,
    })

    workflow.connections = connections

    // Atualizar workflow no N8N
    await n8nService.updateWorkflow(WORKFLOW_ID, {
      nodes: workflow.nodes,
      connections: workflow.connections,
    })

    console.log('✅ Workflow atualizado com sucesso!')
    console.log('Novos nós adicionados:')
    console.log('- Processar Mensagem - Sistema')
    console.log('- Verificar Confirmação')
    console.log('\n⚠️  Você ainda precisa:')
    console.log('1. Conectar o nó "Verificar Confirmação" aos nós de envio de resposta')
    console.log('2. Ajustar a lógica de envio baseada em requiresConfirmation')
    console.log('3. Testar o fluxo completo')
  } catch (error) {
    console.error('❌ Erro ao atualizar workflow:', error)
    throw error
  }
}

// Executar
if (require.main === module) {
  updateWorkflow()
    .then(() => {
      console.log('✨ Concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { updateWorkflow }

