# 🔍 Revisão Completa: Área SUPER_ADMIN

## 📋 Problemas Identificados

### 1. **Rotas e Navegação**
- ❌ Sidebar aponta para `/dashboard/clients` mas o arquivo é `/dashboard/tenants/page.tsx`
- ❌ Páginas não estão enviando header `x-admin-context` nas requisições
- ❌ Verificações de permissão não consideram o contexto (family vs admin)

### 2. **APIs - Contexto não implementado**
- ❌ `/api/plans` - Não verifica contexto, aceita OWNER e ADMIN (que não existe)
- ❌ `/api/payments` - Não verifica contexto, aceita OWNER e ADMIN
- ❌ `/api/reports` - Verifica contexto mas pode ter problemas
- ❌ `/api/n8n/workflows` - Precisa verificar contexto
- ❌ `/api/system/monitor` - Precisa verificar contexto

### 3. **Páginas Frontend - Tema e Contexto**
- ❌ `/dashboard/tenants` - Tema escuro, não envia contexto
- ❌ `/dashboard/plans` - Tema escuro, verifica ADMIN (não existe), não envia contexto
- ❌ `/dashboard/reports` - Verifica ADMIN, não envia contexto
- ❌ `/dashboard/subscriptions` - Precisa verificar contexto
- ❌ `/dashboard/payments` - Precisa verificar contexto e tema
- ❌ `/dashboard/n8n` - Precisa verificar contexto

### 4. **CRUDs Incompletos**
- ❌ Famílias: Falta criar nova família
- ❌ Planos: CRUD completo mas sem contexto
- ❌ Assinaturas: Precisa revisar contexto
- ❌ Pagamentos: CRUD básico, precisa melhorar
- ❌ Usuários: Em modo admin, precisa ver todos os usuários

### 5. **Funcionalidades Faltando**
- ❌ Dashboard Admin específico (mostra métricas de negócio)
- ❌ Filtros e busca avançada nas listagens
- ❌ Exportação de dados (CSV, PDF)
- ❌ Logs de auditoria
- ❌ Notificações para admin

## ✅ Plano de Correção

### Fase 1: Correções Críticas
1. Corrigir rota `/dashboard/clients` → `/dashboard/tenants`
2. Implementar envio de contexto em todas as requisições
3. Atualizar APIs para verificar contexto corretamente
4. Remover referências a `ADMIN` role

### Fase 2: Tema e UX
1. Atualizar todas as páginas para tema claro
2. Melhorar feedback visual (loading, errors, success)
3. Adicionar validações de formulários

### Fase 3: Funcionalidades
1. Criar Dashboard Admin específico
2. Completar CRUDs faltantes
3. Adicionar filtros e busca
4. Implementar exportação de dados

