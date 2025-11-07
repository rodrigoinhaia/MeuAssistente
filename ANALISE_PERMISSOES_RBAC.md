# 🔐 Análise e Correção do Sistema de Permissões (RBAC)

## 📋 Problemas Identificados

### 1. **SUPER_ADMIN não tem acesso a nada** 🔴 CRÍTICO

**Problemas:**
- `/api/users` - requer `['OWNER', 'ADMIN']` - SUPER_ADMIN não está incluído
- `/api/tenants` - requer `['OWNER', 'ADMIN']` - SUPER_ADMIN não está incluído
- `/api/subscriptions` - verifica manualmente se é OWNER ou ADMIN, não inclui SUPER_ADMIN
- Muitas APIs filtram por `familyId` mesmo para SUPER_ADMIN, então ele só vê dados da sua família

**Exemplos:**
```typescript
// ❌ ERRADO - SUPER_ADMIN não pode acessar
const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'ADMIN'])

// ❌ ERRADO - SUPER_ADMIN só vê dados da sua família
const where = { familyId } // Sempre filtra por familyId
```

### 2. **ADMIN tem acesso a coisas que não deveria** 🔴 CRÍTICO

**Problemas:**
- `/api/tenants` - permite ADMIN ver TODAS as famílias (deveria ser só SUPER_ADMIN)
- `/api/tenants` PATCH - permite ADMIN editar qualquer família (deveria ser só SUPER_ADMIN)
- `/api/subscriptions` - permite ADMIN ver TODAS as assinaturas (deveria ser só SUPER_ADMIN ou só da sua família)

**Exemplos:**
```typescript
// ❌ ERRADO - ADMIN pode ver todas as famílias
const families = await prisma.family.findMany({}) // Sem filtro de familyId

// ❌ ERRADO - ADMIN pode editar qualquer família
const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'ADMIN'])
// Depois permite editar qualquer família sem verificar se é da mesma família
```

## ✅ Regras de Permissão Corretas

### **SUPER_ADMIN**
- ✅ Pode acessar **TUDO** (todas as famílias, todos os usuários, todos os dados)
- ✅ Não deve ter filtro de `familyId` nas queries
- ✅ Pode gerenciar todas as famílias (criar, editar, deletar)
- ✅ Pode ver relatórios agregados de todas as famílias
- ✅ Pode acessar monitoramento do sistema
- ✅ Pode gerenciar workflows N8N de todas as famílias

### **OWNER**
- ✅ Pode gerenciar sua própria família (criar, editar usuários)
- ✅ Pode ver todos os dados da sua família
- ✅ Pode gerenciar assinaturas da sua família
- ✅ Pode ver relatórios da sua família
- ✅ Pode ver/editar todas as transações da família
- ❌ **NÃO** pode ver dados de outras famílias
- ❌ **NÃO** pode gerenciar outras famílias

### **USER**
- ✅ Pode ver apenas suas próprias transações
- ✅ Pode criar suas próprias transações
- ❌ **NÃO** pode ver dados de outros usuários
- ❌ **NÃO** pode gerenciar usuários
- ❌ **NÃO** pode ver relatórios da família

## 🔧 Correções Necessárias

### 1. Refatorar `requireAuth` para lidar com SUPER_ADMIN

```typescript
export async function requireAuth(req: Request, allowedRoles: string[] = []) {
  // ...
  
  // SUPER_ADMIN pode acessar tudo, mas ainda precisa de familyId para algumas operações
  if (role === 'SUPER_ADMIN') {
    return { session, role, familyId: null } // familyId null indica acesso global
  }
  
  // ...
}
```

### 2. Corrigir queries para SUPER_ADMIN

```typescript
// ✅ CORRETO
const whereClause = role === 'SUPER_ADMIN' ? {} : { familyId }

// ❌ ERRADO
const where = { familyId } // Sempre filtra por familyId
```

### 3. Corrigir permissões nas APIs

**APIs que devem incluir SUPER_ADMIN:**
- `/api/users` - SUPER_ADMIN pode ver todos os usuários
- `/api/tenants` - SUPER_ADMIN pode ver todas as famílias
- `/api/reports` - SUPER_ADMIN pode ver relatórios agregados
- `/api/system/monitor` - SUPER_ADMIN pode ver monitoramento
- `/api/n8n/workflows` - SUPER_ADMIN pode ver todos os workflows

**APIs que devem restringir ADMIN:**
- `/api/tenants` - ADMIN não pode ver todas as famílias
- `/api/subscriptions` - ADMIN só vê assinaturas da sua família

## 📝 Checklist de Correção

- [ ] Refatorar `requireAuth` para retornar `familyId: null` para SUPER_ADMIN
- [ ] Corrigir `/api/users` para incluir SUPER_ADMIN
- [ ] Corrigir `/api/tenants` para restringir ADMIN e permitir SUPER_ADMIN
- [ ] Corrigir `/api/subscriptions` para incluir SUPER_ADMIN e restringir ADMIN
- [ ] Corrigir `/api/categories` para SUPER_ADMIN ver todas
- [ ] Corrigir `/api/transactions` para SUPER_ADMIN ver todas
- [ ] Corrigir `/api/dashboard/stats` para SUPER_ADMIN ver agregado
- [ ] Corrigir `/api/reports` para SUPER_ADMIN ver agregado
- [ ] Verificar todas as outras APIs

