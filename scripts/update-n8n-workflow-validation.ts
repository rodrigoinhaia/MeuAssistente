/**
 * Script para atualizar o workflow N8N e adicionar validação de usuário
 * 
 * Uso: npx tsx scripts/update-n8n-workflow-validation.ts
 * 
 * NOTA: Este script requer que o N8N esteja acessível via API
 * Configure as variáveis de ambiente:
 * - N8N_API_URL
 * - N8N_API_KEY
 */

import { N8NService } from '@/lib/n8n'

const WORKFLOW_ID = 'jydoDAnOVojEGX0D'

interface NodePosition {
  x: number
  y: number
}

async function updateWorkflowWithValidation() {
  try {
    console.log('🔄 Iniciando atualização do workflow N8N...')
    
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
    console.log('📥 Buscando workflow...')
    const workflow = await n8nService.getWorkflow(WORKFLOW_ID)
    
    if (!workflow) {
      console.error('❌ Workflow não encontrado')
      return
    }

    console.log(`✅ Workflow encontrado: ${workflow.name}`)
    console.log(`📊 Total de nós: ${workflow.nodes.length}`)

    // Encontrar o nó "Processar Mensagem - Sistema"
    const processMessageNode = workflow.nodes.find(
      (node: any) => node.name === 'Processar Mensagem - Sistema'
    )

    if (!processMessageNode) {
      console.error('❌ Nó "Processar Mensagem - Sistema" não encontrado')
      console.log('💡 Execute primeiro o script update-n8n-workflow.ts')
      return
    }

    console.log('✅ Nó "Processar Mensagem - Sistema" encontrado')

    // Encontrar o nó "Switch" (próximo nó)
    const switchNode = workflow.nodes.find(
      (node: any) => node.name === 'Switch'
    )

    if (!switchNode) {
      console.error('❌ Nó "Switch" não encontrado')
      return
    }

    // Verificar se já existe o nó IF de validação
    const existingValidationNode = workflow.nodes.find(
      (node: any) => node.name === 'Verificar Usuário Cadastrado'
    )

    if (existingValidationNode) {
      console.log('⚠️  Nó de validação já existe. Pulando criação...')
      return
    }

    // Criar nó IF para verificar usuário cadastrado
    const validationIfNode = {
      id: `validate-user-${Date.now()}`,
      name: 'Verificar Usuário Cadastrado',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [
        (processMessageNode.position[0] || 0) + 400,
        (processMessageNode.position[1] || 0) || 0,
      ] as [number, number],
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
          },
          conditions: [
            {
              id: 'condition1',
              leftValue: "={{ $json.userRegistered }}",
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'true',
              },
            },
          ],
          combinator: 'and',
        },
      },
    }

    // Criar nó Set para formatar mensagem não cadastrado
    const formatMessageNode = {
      id: `format-message-${Date.now()}`,
      name: 'Formatar Mensagem Não Cadastrado',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [
        (validationIfNode.position[0] || 0) + 200,
        (validationIfNode.position[1] || 0) + 200,
      ] as [number, number],
      parameters: {
        assignments: {
          assignments: [
            {
              id: `assignment-${Date.now()}`,
              name: 'text',
              value: "={{ $('Processar Mensagem - Sistema').item.json.response }}",
              type: 'string',
            },
          ],
        },
        options: {},
      },
    }

    console.log('📝 Criando nós de validação...')

    // Adicionar nós ao workflow
    workflow.nodes.push(validationIfNode)
    workflow.nodes.push(formatMessageNode)

    // Atualizar conexões
    // Remover conexão direta: Processar Mensagem - Sistema → Switch
    if (workflow.connections[processMessageNode.name]) {
      const mainConnections = workflow.connections[processMessageNode.name].main
      if (mainConnections && mainConnections[0]) {
        // Encontrar conexão com Switch
        const switchConnectionIndex = mainConnections[0].findIndex(
          (conn: any) => conn.node === 'Switch'
        )
        if (switchConnectionIndex >= 0) {
          mainConnections[0].splice(switchConnectionIndex, 1)
        }
      }
    }

    // Adicionar conexão: Processar Mensagem - Sistema → Verificar Usuário Cadastrado
    if (!workflow.connections[processMessageNode.name]) {
      workflow.connections[processMessageNode.name] = { main: [[]] }
    }
    if (!workflow.connections[processMessageNode.name].main[0]) {
      workflow.connections[processMessageNode.name].main[0] = []
    }
    workflow.connections[processMessageNode.name].main[0].push({
      node: validationIfNode.name,
      type: 'main',
      index: 0,
    })

    // Adicionar conexão: Verificar Usuário Cadastrado (TRUE) → Switch
    if (!workflow.connections[validationIfNode.name]) {
      workflow.connections[validationIfNode.name] = { main: [[], []] }
    }
    workflow.connections[validationIfNode.name].main[0].push({
      node: switchNode.name,
      type: 'main',
      index: 0,
    })

    // Adicionar conexão: Verificar Usuário Cadastrado (FALSE) → Formatar Mensagem
    workflow.connections[validationIfNode.name].main[1].push({
      node: formatMessageNode.name,
      type: 'main',
      index: 0,
    })

    console.log('💾 Salvando workflow atualizado...')

    // Atualizar workflow
    await n8nService.updateWorkflow(WORKFLOW_ID, {
      nodes: workflow.nodes,
      connections: workflow.connections,
    })

    console.log('✅ Workflow atualizado com sucesso!')
    console.log('📋 Próximos passos:')
    console.log('   1. Abra o workflow no N8N')
    console.log('   2. Conecte "Formatar Mensagem Não Cadastrado" ao nó de envio')
    console.log('   3. Teste com usuário cadastrado e não cadastrado')
  } catch (error) {
    console.error('❌ Erro ao atualizar workflow:', error)
    throw error
  }
}

// Executar
if (require.main === module) {
  updateWorkflowWithValidation()
    .then(() => {
      console.log('✨ Concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { updateWorkflowWithValidation }

