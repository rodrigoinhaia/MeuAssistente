# 🔄 Novo Modelo: SUPER_ADMIN com Contexto

## 📋 Mudança de Conceito

**ANTES:**
- SUPER_ADMIN tinha acesso total a tudo (todas as famílias, todos os dados)
- Não fazia parte de uma família
- Gerenciava tudo do sistema

**AGORA:**
- SUPER_ADMIN **faz parte de uma família** (tem sua própria família)
- Pode **alternar entre dois modos**:
  - **Modo Família**: Comporta-se como OWNER (gerencia sua própria família)
  - **Modo Admin**: Gerencia configurações globais e usuários (não vê dados financeiros de outras famílias)

---

## 🎯 Dois Modos de Operação

### 1. **Modo Família** (Padrão)
**Comportamento:**
- ✅ Comporta-se como **OWNER**
- ✅ Vê apenas dados da **sua própria família**
- ✅ Gerencia usuários da **sua família**
- ✅ Gerencia transações, categorias, compromissos da **sua família**
- ✅ Menu mostra: Dashboard, Usuários, Categorias, Transações, etc.

**Quando usar:**
- Uso normal do sistema
- Gerenciar sua própria família
- Trabalhar com seus dados pessoais

### 2. **Modo Admin** (Configurações Globais)
**Comportamento:**
- ✅ Gerencia **configurações globais** do sistema
- ✅ Vê lista de **todas as famílias** (apenas informações básicas)
- ✅ Gerencia **planos e assinaturas**
- ✅ Gerencia **pagamentos**
- ✅ Vê **relatórios agregados** (métricas de negócio)
- ✅ Monitora **N8N workflows**
- ❌ **NÃO** vê dados financeiros de outras famílias
- ❌ **NÃO** vê transações de outras famílias
- ❌ **NÃO** vê categorias de outras famílias
- Menu mostra: Dashboard Admin, Famílias, Planos, Assinaturas, Pagamentos, Relatórios, N8N

**Quando usar:**
- Configurar planos e assinaturas
- Gerenciar famílias (ativar/desativar)
- Ver relatórios de negócio
- Monitorar sistema

---

## 🔧 Implementação Técnica

### 1. **Sistema de Contexto** (`src/lib/context.ts`)
```typescript
type AdminContext = 'family' | 'admin'

// Armazenado no localStorage
getAdminContext() // Retorna contexto atual
setAdminContext(context) // Define novo contexto
```

### 2. **Seletor no Sidebar**
- SUPER_ADMIN vê dois botões: "Família" e "Admin"
- Alterna entre os modos
- Menu muda dinamicamente baseado no contexto

### 3. **APIs Ajustadas**
- `requireAuth` agora aceita `adminContext`
- APIs verificam o contexto antes de retornar dados
- SUPER_ADMIN em modo família usa `familyId` da sessão
- SUPER_ADMIN em modo admin pode ter `familyId: null` para algumas operações

### 4. **Permissões por Contexto**

**Modo Família:**
- `/api/users` → Vê apenas usuários da sua família
- `/api/transactions` → Vê apenas transações da sua família
- `/api/categories` → Vê apenas categorias da sua família
- `/api/dashboard/stats` → Estatísticas da sua família

**Modo Admin:**
- `/api/tenants` → Vê todas as famílias (apenas modo admin)
- `/api/users` → Vê todos os usuários (apenas modo admin)
- `/api/plans` → Gerencia planos
- `/api/subscriptions` → Gerencia assinaturas
- `/api/reports` → Relatórios agregados

---

## 📝 Regras de Permissão Atualizadas

### **SUPER_ADMIN em Modo Família**
- ✅ Comporta-se como **OWNER**
- ✅ Acesso à sua própria família
- ✅ Pode gerenciar usuários da sua família
- ✅ Pode ver/editar transações da sua família
- ❌ **NÃO** pode ver dados de outras famílias

### **SUPER_ADMIN em Modo Admin**
- ✅ Gerencia configurações globais
- ✅ Vê lista de famílias (informações básicas)
- ✅ Gerencia planos e assinaturas
- ✅ Vê relatórios agregados
- ✅ Monitora N8N
- ❌ **NÃO** vê dados financeiros de outras famílias
- ❌ **NÃO** vê transações de outras famílias

### **OWNER**
- ✅ Gerencia sua própria família
- ✅ Vê todos os dados da sua família
- ✅ Gerencia usuários da sua família
- ❌ **NÃO** pode ver dados de outras famílias

### **USER**
- ✅ Vê apenas suas próprias transações
- ✅ Cria suas próprias transações
- ❌ **NÃO** pode ver dados de outros usuários

---

## 🎨 Interface

### Seletor de Contexto (Sidebar)
```
┌─────────────────────────┐
│ Modo de Visualização    │
├─────────────────────────┤
│ [🏠 Família] [⚙️ Admin] │
└─────────────────────────┘
```

- **Família** (ativo): Fundo ciano, borda ciano
- **Admin** (ativo): Fundo roxo, borda roxa
- Alterna entre os modos ao clicar

### Menu Dinâmico

**Modo Família:**
- Dashboard
- Usuários
- Categorias
- Transações
- Compromissos
- Tarefas
- Integrações
- Configurações

**Modo Admin:**
- Dashboard Admin
- Famílias
- Planos
- Assinaturas
- Pagamentos
- Relatórios
- Monitoramento N8N
- Configurações

---

## 🔐 Segurança

### Proteções Implementadas
1. **Contexto verificado no servidor**: Header `x-admin-context` enviado nas requisições
2. **APIs validam contexto**: Cada API verifica se está no modo correto
3. **Dados financeiros protegidos**: SUPER_ADMIN nunca vê dados financeiros de outras famílias
4. **Isolamento garantido**: Cada modo tem suas próprias permissões

### Headers Enviados
```typescript
headers: {
  'x-admin-context': 'family' | 'admin'
}
```

---

## 📊 Exemplos de Uso

### Exemplo 1: SUPER_ADMIN usando como usuário normal
1. Login como SUPER_ADMIN
2. Contexto padrão: "Família"
3. Vê menu de família
4. Gerencia sua própria família normalmente
5. Comporta-se como OWNER

### Exemplo 2: SUPER_ADMIN configurando sistema
1. Login como SUPER_ADMIN
2. Clica em "Admin" no seletor
3. Menu muda para opções administrativas
4. Acessa "Famílias" → Vê lista de todas as famílias
5. Acessa "Planos" → Gerencia planos
6. **NÃO** vê transações de outras famílias

---

## ✅ Benefícios

1. **Privacidade**: SUPER_ADMIN não vê dados financeiros de outras famílias
2. **Simplicidade**: SUPER_ADMIN também tem sua família e pode usar normalmente
3. **Separação clara**: Modo família vs modo admin bem definidos
4. **Flexibilidade**: Alterna entre modos facilmente
5. **Segurança**: Dados financeiros sempre isolados por família

---

## 🚀 Próximos Passos

1. ✅ Sistema de contexto implementado
2. ✅ Seletor no Sidebar criado
3. ✅ APIs ajustadas para respeitar contexto
4. ⏳ Ajustar todas as APIs que precisam verificar contexto
5. ⏳ Atualizar páginas do dashboard para enviar contexto
6. ⏳ Testar alternância entre modos

