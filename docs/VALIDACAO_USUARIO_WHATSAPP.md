# Validação de Usuário no WhatsApp

## 📋 Funcionalidade Implementada

O sistema agora **valida se o usuário está cadastrado** antes de processar qualquer mensagem do WhatsApp.

## 🔍 Como Funciona

### 1. Identificação do Usuário

O sistema identifica o usuário pelo número de telefone em **duas etapas**:

1. **Busca no campo `User.phone`**: Procura usuários cadastrados pelo telefone
2. **Busca no campo `Family.phoneNumber`**: Se não encontrar usuário, tenta encontrar a família

### 2. Normalização de Telefone

O sistema normaliza números de telefone para formato padrão:
- Remove caracteres não numéricos
- Adiciona código do país (55 para Brasil) se necessário
- Remove zeros iniciais

**Exemplos:**
- `(11) 99999-9999` → `5511999999999`
- `11999999999` → `5511999999999`
- `5511999999999` → `5511999999999` (mantém)

### 3. Validação

**Se o usuário NÃO estiver cadastrado:**
- ❌ **NÃO processa** a mensagem
- ✅ **Envia mensagem informativa** pedindo para verificar com o chefe da família

**Se o usuário estiver cadastrado:**
- ✅ Processa normalmente
- ✅ Identifica família automaticamente
- ✅ Cria contexto de sessão

## 📝 Mensagem para Usuário Não Cadastrado

```
❌ Você não está cadastrado no sistema.

Para usar o MeuAssistente, é necessário que o chefe da sua família te adicione ao sistema.

📋 O que fazer:
1. Entre em contato com o chefe da sua família
2. Peça para ele acessar o sistema e adicionar você como membro
3. Após ser adicionado, você poderá usar o assistente normalmente

💡 Dúvidas? Entre em contato com o suporte através do sistema web.

Obrigado pela compreensão! 🙏
```

## 🔧 Arquivos Modificados

### 1. `src/lib/whatsapp/user-identification.ts` (NOVO)

Funções principais:
- `identifyUserByPhone()` - Identifica usuário e família pelo telefone
- `normalizePhoneNumber()` - Normaliza formato do telefone
- `isUserRegistered()` - Verifica se usuário está cadastrado
- `getUnregisteredUserMessage()` - Retorna mensagem padrão
- `getFamilyOwnerInfo()` - Obtém informações do chefe da família

### 2. `src/lib/whatsapp/message-processor.ts` (ATUALIZADO)

- Adiciona validação **ANTES** de processar mensagem
- Verifica se usuário está cadastrado
- Verifica se família está ativa
- Valida contexto em tempo real

### 3. `src/lib/whatsapp/session-context.ts` (ATUALIZADO)

- Usa `identifyUserByPhone()` para inicializar contexto
- Garante que só cria contexto para usuários cadastrados

### 4. `src/app/api/webhooks/whatsapp/route.ts` (ATUALIZADO)

- Valida usuário **ANTES** de processar
- Retorna mensagem informativa se não cadastrado

### 5. `src/app/api/webhooks/n8n/route.ts` (ATUALIZADO)

- Valida usuário antes de processar
- Retorna mensagem informativa se não cadastrado

## 🎯 Fluxo Completo

```
Mensagem recebida
  ↓
Normalizar telefone
  ↓
Buscar usuário no banco (User.phone)
  ├─ Encontrou? → Validar se ativo → Processar
  └─ Não encontrou? → Buscar família (Family.phoneNumber)
      ├─ Encontrou? → Usar OWNER da família → Processar
      └─ Não encontrou? → Enviar mensagem de não cadastrado
```

## 📊 Estrutura de Dados

### UserIdentification

```typescript
interface UserIdentification {
  userId: string          // ID do usuário
  userName: string        // Nome do usuário
  familyId: string        // ID da família
  familyName: string      // Nome da família
  phoneNumber: string     // Telefone normalizado
  role: string           // OWNER, USER, etc.
  isActive: boolean      // Se está ativo
}
```

## 🧪 Testes

### Teste 1: Usuário Cadastrado

**Entrada:**
```json
{
  "phoneNumber": "5511999999999",
  "message": "Gastei R$ 50 no restaurante"
}
```

**Resultado:** Processa normalmente

### Teste 2: Usuário Não Cadastrado

**Entrada:**
```json
{
  "phoneNumber": "5511888888888",
  "message": "Gastei R$ 50 no restaurante"
}
```

**Resultado:** Retorna mensagem de não cadastrado

### Teste 3: Família Cadastrada, Usuário Não

**Entrada:**
```json
{
  "phoneNumber": "5511777777777", // Telefone da família
  "message": "Gastei R$ 50 no restaurante"
}
```

**Resultado:** Usa o OWNER da família para processar

## ⚙️ Configuração

Nenhuma configuração adicional necessária. O sistema usa os dados do banco de dados (Prisma).

## 🔒 Segurança

- ✅ Validação em múltiplas camadas
- ✅ Verificação de usuário ativo
- ✅ Verificação de família ativa
- ✅ Validação de contexto em tempo real
- ✅ Mensagem clara para usuários não cadastrados

## 📚 Próximos Passos (Opcional)

1. **Adicionar nome do chefe na mensagem:**
   - Usar `getFamilyOwnerInfo()` para personalizar mensagem

2. **Log de tentativas:**
   - Registrar tentativas de usuários não cadastrados

3. **Rate limiting:**
   - Limitar mensagens de usuários não cadastrados

4. **Notificação ao chefe:**
   - Notificar quando alguém tenta usar sem estar cadastrado

