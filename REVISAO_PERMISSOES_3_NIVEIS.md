# 🔐 Revisão Completa do Sistema de Permissões - 3 Níveis

## 📋 Níveis de Permissão

O sistema possui **3 níveis de permissão**:

1. **SUPER_ADMIN** - Administrador do sistema
2. **OWNER** - Proprietário/Gerente da família
3. **USER** - Usuário comum (membro da família)

---

## 🎯 Regras de Permissão por Nível

### 1. **SUPER_ADMIN**

**Características:**
- Faz parte de uma família (tem `familyId`)
- Pode alternar entre dois modos:
  - **Modo Família** (`family`): Comporta-se como OWNER
  - **Modo Admin** (`admin`): Gerencia configurações globais

#### Modo Família (`family`)
- ✅ Vê apenas dados da **sua própria família**
- ✅ Gerencia usuários da **sua família**
- ✅ Gerencia transações, categorias, compromissos, tarefas da **sua família**
- ✅ Acesso igual ao OWNER

#### Modo Admin (`admin`)
- ✅ Gerencia **configurações globais** do sistema
- ✅ Vê lista de **todas as famílias** (apenas informações básicas)
- ✅ Gerencia **planos e assinaturas**
- ✅ Gerencia **pagamentos**
- ✅ Vê **relatórios agregados** (métricas de negócio)
- ✅ Monitora **N8N workflows**
- ✅ Acessa **Settings** (configurações do sistema)
- ❌ **NÃO** vê dados financeiros de outras famílias
- ❌ **NÃO** vê transações de outras famílias
- ❌ **NÃO** vê categorias de outras famílias

---

### 2. **OWNER**

**Características:**
- Gerencia sua própria família
- Acesso completo aos dados da família

**Permissões:**
- ✅ Gerencia usuários da **sua família** (criar, editar, ativar/desativar)
- ✅ Vê **todos os dados** da sua família
- ✅ Gerencia **assinaturas** da sua família
- ✅ Vê **relatórios** da sua família
- ✅ Vê/edita **todas as transações** da família
- ✅ Gerencia **categorias** da família
- ✅ Gerencia **compromissos** da família
- ✅ Gerencia **tarefas** da família
- ✅ Gerencia **integrações** da família
- ❌ **NÃO** pode ver dados de outras famílias
- ❌ **NÃO** pode gerenciar outras famílias
- ❌ **NÃO** pode acessar configurações globais

---

### 3. **USER**

**Características:**
- Membro comum da família
- Acesso restrito aos próprios dados

**Permissões:**
- ✅ Vê apenas **suas próprias transações**
- ✅ Cria **suas próprias transações**
- ✅ Edita **apenas suas próprias transações**
- ✅ Vê **suas próprias tarefas**
- ✅ Cria **suas próprias tarefas**
- ✅ Edita **apenas suas próprias tarefas**
- ✅ Vê **seus próprios compromissos**
- ✅ Cria **seus próprios compromissos**
- ✅ Edita **apenas seus próprios compromissos**
- ✅ Vê **categorias** da família (para usar nas transações)
- ❌ **NÃO** pode ver transações de outros usuários
- ❌ **NÃO** pode ver tarefas de outros usuários
- ❌ **NÃO** pode ver compromissos de outros usuários
- ❌ **NÃO** pode gerenciar usuários
- ❌ **NÃO** pode ver relatórios da família
- ❌ **NÃO** pode gerenciar categorias
- ❌ **NÃO** pode acessar configurações

---

## 📊 Matriz de Permissões por Recurso

| Recurso | SUPER_ADMIN (family) | SUPER_ADMIN (admin) | OWNER | USER |
|---------|---------------------|---------------------|-------|------|
| **Transações** | Todas da família | ❌ Bloqueado | Todas da família | Apenas próprias |
| **Categorias** | Todas da família | ❌ Bloqueado | Todas da família | Apenas visualizar |
| **Compromissos** | Todos da família | ❌ Bloqueado | Todos da família | Apenas próprios |
| **Tarefas** | Todas da família | ❌ Bloqueado | Todas da família | Apenas próprias |
| **Usuários** | Da família | ❌ Bloqueado | Da família | ❌ Bloqueado |
| **Famílias** | ❌ Bloqueado | Lista (básico) | ❌ Bloqueado | ❌ Bloqueado |
| **Planos** | ❌ Bloqueado | ✅ Gerenciar | ❌ Bloqueado | ❌ Bloqueado |
| **Assinaturas** | Da família | Todas | Da família | ❌ Bloqueado |
| **Pagamentos** | ❌ Bloqueado | Todas | ❌ Bloqueado | ❌ Bloqueado |
| **Relatórios** | Da família | Agregados | Da família | ❌ Bloqueado |
| **Settings** | ❌ Bloqueado | ✅ Gerenciar | ❌ Bloqueado | ❌ Bloqueado |
| **Monitor** | ❌ Bloqueado | ✅ Acessar | ❌ Bloqueado | ❌ Bloqueado |
| **N8N** | Da família | Todas | Da família | ❌ Bloqueado |

---

## 🔍 Verificação de Implementação

### ✅ APIs que Implementam USER Corretamente

1. **`/api/transactions`** ✅
   - USER: Filtra por `userId` (apenas próprias transações)
   - OWNER: Vê todas da família
   - Implementado em: `src/app/api/transactions/route.ts:73`

2. **`/api/transactions/[id]`** ✅
   - USER: Só pode editar/deletar suas próprias transações
   - OWNER: Pode editar/deletar qualquer transação da família
   - Implementado em: `src/app/api/transactions/[id]/route.ts:34,97`

3. **`/api/tasks/[id]`** ✅
   - USER: Só pode editar/deletar suas próprias tarefas
   - OWNER: Pode editar/deletar qualquer tarefa da família
   - Implementado em: `src/app/api/tasks/[id]/route.ts:64,114`

4. **`/api/commitments/[id]`** ✅
   - USER: Só pode editar/deletar seus próprios compromissos
   - OWNER: Pode editar/deletar qualquer compromisso da família
   - Implementado em: `src/app/api/commitments/route.ts:93,144`

### ⚠️ APIs que Precisam de Verificação

1. **`/api/categories`**
   - ✅ USER pode visualizar categorias (necessário para criar transações)
   - ⚠️ Verificar se USER pode criar/editar categorias (provavelmente não deveria)

2. **`/api/commitments` (GET)**
   - ⚠️ Atualmente retorna todos os compromissos da família
   - ❌ USER deveria ver apenas os próprios

3. **`/api/tasks` (GET)**
   - ⚠️ Atualmente retorna todas as tarefas da família
   - ❌ USER deveria ver apenas as próprias

---

## 🔧 Correções Necessárias

### 1. **Filtrar Compromissos por USER**

**Arquivo:** `src/app/api/commitments/route.ts`

```typescript
// GET - Filtrar por userId se for USER
export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  const userId = (session.user as any)?.id
  const where: any = { familyId }
  
  // USER só vê seus próprios compromissos
  if (role === 'USER') {
    where.userId = userId
  }
  
  // ... resto do código
}
```

### 2. **Filtrar Tarefas por USER**

**Arquivo:** `src/app/api/tasks/route.ts`

```typescript
// GET - Filtrar por userId se for USER
export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  const userId = (session.user as any)?.id
  const where: any = { familyId }
  
  // USER só vê suas próprias tarefas
  if (role === 'USER') {
    where.userId = userId
  }
  
  // ... resto do código
}
```

### 3. **Restringir Criação/Edição de Categorias para USER**

**Arquivo:** `src/app/api/categories/route.ts`

```typescript
// POST - Apenas OWNER pode criar categorias
export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  // ... resto do código
}

// PUT - Apenas OWNER pode editar categorias
export async function PUT(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  // ... resto do código
}
```

---

## 📝 Checklist de Implementação

### APIs
- [x] `/api/transactions` - USER filtra por userId
- [x] `/api/transactions/[id]` - USER só edita próprias
- [x] `/api/commitments` (GET) - USER filtra por userId
- [x] `/api/commitments/[id]` - USER só edita próprios
- [x] `/api/tasks` (GET) - USER filtra por userId
- [x] `/api/tasks/[id]` - USER só edita próprias
- [x] `/api/categories` (POST/PUT/DELETE) - Restringir para OWNER/SUPER_ADMIN

### Frontend
- [ ] Verificar se páginas de compromissos filtram por USER
- [ ] Verificar se páginas de tarefas filtram por USER
- [ ] Verificar se USER pode criar/editar categorias no frontend
- [ ] Verificar se menu lateral oculta itens para USER

---

## 🎯 Resumo das Regras

### SUPER_ADMIN
- **Modo Família**: Igual a OWNER
- **Modo Admin**: Configurações globais (sem dados financeiros de outras famílias)

### OWNER
- Acesso completo aos dados da família
- Pode gerenciar usuários da família
- Pode ver/editar tudo da família

### USER
- Acesso restrito aos próprios dados
- Pode criar/editar apenas suas transações, tarefas e compromissos
- Pode visualizar categorias (para usar nas transações)
- Não pode gerenciar usuários ou configurações

