/**
 * Configuração do Axios para enviar contexto do SUPER_ADMIN
 * Intercepta requisições e adiciona header x-admin-context
 */

import axios from 'axios'
import { getAdminContext } from './context'

// Criar instância do axios
const apiClient = axios.create({
  baseURL: '/api',
})

// Interceptor para adicionar contexto nas requisições
apiClient.interceptors.request.use(
  (config) => {
    // Tenta pegar o contexto do localStorage (client-side)
    if (typeof window !== 'undefined') {
      // Lê diretamente do localStorage para garantir que está atualizado
      const stored = localStorage.getItem('admin_context')
      const context = (stored === 'admin' || stored === 'family') ? stored : 'family'
      config.headers['x-admin-context'] = context
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient

