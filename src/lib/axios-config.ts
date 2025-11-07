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
      const context = getAdminContext(undefined) // Passa undefined para pegar do localStorage
      if (context === 'admin' || context === 'family') {
        config.headers['x-admin-context'] = context
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient

