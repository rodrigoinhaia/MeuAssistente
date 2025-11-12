/**
 * Serviço de integração com N8N
 * Gerencia comunicação com a API do N8N para workflows e automações
 */

interface N8NConfig {
  url: string
  apiKey: string
  webhookUrl?: string
}

interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  nodes: any[]
  connections: any
  settings?: any
  staticData?: any
  tags?: any[]
}

interface N8NExecution {
  id: string
  finished: boolean
  mode: string
  retryOf?: string
  retrySuccessId?: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  workflowData: N8NWorkflow
  data: any
}

class N8NService {
  private config: N8NConfig | null = null

  /**
   * Configura o serviço N8N com credenciais
   */
  setConfig(config: N8NConfig) {
    this.config = config
  }

  /**
   * Obtém configuração do N8N
   */
  getConfig(): N8NConfig | null {
    return this.config
  }

  /**
   * Valida conexão com N8N
   */
  async validateConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('N8N não configurado. Configure a URL e API Key primeiro.')
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao validar conexão com N8N:', error)
      return false
    }
  }

  /**
   * Lista todos os workflows do N8N
   */
  async getWorkflows(): Promise<N8NWorkflow[]> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar workflows: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar workflows do N8N:', error)
      throw error
    }
  }

  /**
   * Obtém um workflow específico por ID
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflow | null> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Erro ao buscar workflow: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao buscar workflow do N8N:', error)
      throw error
    }
  }

  /**
   * Ativa ou desativa um workflow
   */
  async toggleWorkflow(workflowId: string, active: boolean): Promise<N8NWorkflow> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow) {
        throw new Error('Workflow não encontrado')
      }

      const response = await fetch(`${this.config.url}/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...workflow,
          active,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao atualizar workflow: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao atualizar workflow do N8N:', error)
      throw error
    }
  }

  /**
   * Cria um novo workflow
   */
  async createWorkflow(workflow: Partial<N8NWorkflow>): Promise<N8NWorkflow> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      })

      if (!response.ok) {
        throw new Error(`Erro ao criar workflow: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao criar workflow no N8N:', error)
      throw error
    }
  }

  /**
   * Executa um workflow manualmente
   */
  async executeWorkflow(workflowId: string, inputData?: any): Promise<N8NExecution> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData || {}),
      })

      if (!response.ok) {
        throw new Error(`Erro ao executar workflow: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao executar workflow no N8N:', error)
      throw error
    }
  }

  /**
   * Obtém execuções de um workflow
   */
  async getWorkflowExecutions(workflowId: string, limit: number = 10): Promise<N8NExecution[]> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const response = await fetch(
        `${this.config.url}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao buscar execuções: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar execuções do N8N:', error)
      throw error
    }
  }

  /**
   * Deleta um workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const response = await fetch(`${this.config.url}/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao deletar workflow: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao deletar workflow do N8N:', error)
      throw error
    }
  }

  /**
   * Dispara um webhook do N8N
   */
  async triggerWebhook(webhookPath: string, data: any): Promise<any> {
    if (!this.config) {
      throw new Error('N8N não configurado')
    }

    try {
      const webhookUrl = `${this.config.url}/webhook/${webhookPath}`
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Erro ao disparar webhook: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao disparar webhook do N8N:', error)
      throw error
    }
  }
}

// Exportar classe
export { N8NService }

// Exportar instância singleton
export const n8nService = new N8NService()

// Exportar tipos
export type { N8NConfig, N8NWorkflow, N8NExecution }

