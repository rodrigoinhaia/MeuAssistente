# 🔧 Como Usar a Validação de Usuário no Fluxo N8N

## ✅ Resumo Rápido

**A validação já está funcionando automaticamente!** Quando o N8N chama o endpoint `/api/webhooks/whatsapp`, o sistema:

1. ✅ **Identifica automaticamente** o usuário pelo telefone
2. ✅ **Valida se está cadastrado** no banco de dados
3. ✅ **Retorna mensagem** se não estiver cadastrado
4. ✅ **Processa normalmente** se estiver cadastrado

**Você não precisa fazer nada no N8N além de chamar o endpoint!**

## 🎯 Fluxo Atual (Já Funcionando)

```
WhatsApp → N8N → Sistema (/api/webhooks/whatsapp)
                      ↓
                  Valida Usuário (AUTOMÁTICO)
                      ↓
              ┌───────┴───────┐
              │               │
         Cadastrado?    Não Cadastrado?
              │               │
              ↓               ↓
        Processa        Retorna Mensagem
        Mensagem        "Não cadastrado"
              │               │
              └───────┬───────┘
                      ↓
              Retorna Resposta
                      ↓
                  N8N → WhatsApp
```

## 📋 O que o Sistema Faz Automaticamente

### 1. Quando Recebe a Mensagem

O endpoint `/api/webhooks/whatsapp` **automaticamente**:

```typescript
// 1. Normaliza o telefone
phoneNumber = "5511999999999@s.whatsapp.net" 
  → normaliza para → "5511999999999"

// 2. Busca no banco
- Tenta encontrar em User.phone
- Se não encontrar, tenta Family.phoneNumber
- Se encontrar, usa o OWNER da família

// 3. Valida
- Se não encontrou → Retorna mensagem de não cadastrado
- Se encontrou → Processa normalmente
```

### 2. Resposta do Sistema

**Se usuário NÃO está cadastrado:**
```json
{
  "status": "success",
  "response": "❌ Você não está cadastrado no sistema.\n\nPara usar o MeuAssistente...",
  "requiresConfirmation": false,
  "action": "none",
  "userRegistered": false
}
```

**Se usuário ESTÁ cadastrado:**
```json
{
  "status": "success",
  "response": "✅ Entendi! Confirmar:\n\n💰 Despesa: R$ 50,00...",
  "requiresConfirmation": true,
  "action": "transaction"
}
```

## 🔧 Configuração no N8N (Já Feita)

O nó **"Processar Mensagem - Sistema"** já está configurado e faz tudo automaticamente:

### Nó HTTP Request

**Nome:** `Processar Mensagem - Sistema`

**URL:** `{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp`

**Método:** POST

**Headers:**
```
Authorization: Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET }}
Content-Type: application/json
```

**Body:**
```json
{
  "phoneNumber": "={{ $json.telefoneCliente }}",
  "message": "={{ $json.mensagem }}",
  "messageType": "={{ $json.tipoMensagem || 'text' }}"
}
```

**Resposta:**
```json
{
  "status": "success",
  "response": "...",
  "requiresConfirmation": true/false,
  "action": "transaction" | "appointment" | "none",
  "userRegistered": true/false  // NOVO: indica se está cadastrado
}
```

## 🎨 Como Usar no Fluxo N8N

### Opção 1: Usar Direto (Mais Simples)

**Fluxo:**
```
Edit Fields
  ↓
Processar Mensagem - Sistema (HTTP Request)
  ↓
Enviar Resposta (usa $json.response)
```

**No nó "Enviar Resposta":**
```
{{ $('Processar Mensagem - Sistema').item.json.response }}
```

**Resultado:**
- Se cadastrado → Envia resposta processada
- Se não cadastrado → Envia mensagem "Não cadastrado"

### Opção 2: Verificar Antes de Processar (Opcional)

Se você quiser fazer algo diferente quando não estiver cadastrado:

**Fluxo:**
```
Edit Fields
  ↓
Processar Mensagem - Sistema (HTTP Request)
  ↓
IF (userRegistered === false?)
  ├─ SIM → Enviar mensagem personalizada
  └─ NÃO → Continuar fluxo normal
```

**Nó IF:**
```
Condição: {{ $json.userRegistered }} === false
```

**Exemplo de uso:**
```
IF (userRegistered === false)
  ↓
  Enviar mensagem: "Você precisa se cadastrar primeiro. Contate o chefe da família."
  ↓
  FIM (não processa mais nada)

IF (userRegistered === true)
  ↓
  Continuar fluxo normal
```

### Opção 3: Verificar Confirmação (Recomendado)

**Fluxo completo:**
```
Edit Fields
  ↓
Processar Mensagem - Sistema
  ↓
IF (requiresConfirmation === true?)
  ├─ SIM → Salvar contexto + Enviar confirmação
  └─ NÃO → Enviar resposta direta
```

## 📊 Exemplos Práticos

### Exemplo 1: Usuário Cadastrado

**Entrada:**
```json
{
  "phoneNumber": "5511999999999@s.whatsapp.net",
  "message": "Gastei R$ 50 no restaurante"
}
```

**Sistema processa:**
1. Normaliza: `5511999999999`
2. Busca no banco: ✅ Encontrou usuário
3. Processa mensagem
4. Retorna: `{ response: "✅ Entendi! Confirmar...", requiresConfirmation: true }`

**N8N envia:** Mensagem de confirmação

### Exemplo 2: Usuário NÃO Cadastrado

**Entrada:**
```json
{
  "phoneNumber": "5511888888888@s.whatsapp.net",
  "message": "Gastei R$ 50 no restaurante"
}
```

**Sistema processa:**
1. Normaliza: `5511888888888`
2. Busca no banco: ❌ Não encontrou
3. **NÃO processa** a mensagem
4. Retorna: `{ response: "❌ Você não está cadastrado...", userRegistered: false }`

**N8N envia:** Mensagem "Não cadastrado"

## 🔍 Verificações no N8N (Opcional)

### Verificar se Usuário Está Cadastrado

**Nó IF:**
```
Condição: {{ $json.userRegistered }} === true
```

**Uso:**
- Se `true` → Processa normalmente
- Se `false` → Envia mensagem e para o fluxo

### Verificar se Precisa Confirmação

**Nó IF:**
```
Condição: {{ $json.requiresConfirmation }} === true
```

**Uso:**
- Se `true` → Salva contexto e envia confirmação
- Se `false` → Envia resposta direta

### Verificar Tipo de Ação

**Nó Switch:**
```
Case 1: {{ $json.action }} === "transaction"
Case 2: {{ $json.action }} === "appointment"
Case 3: {{ $json.action }} === "report"
Default: Outros
```

## 🧪 Testar no N8N

### Teste 1: Usuário Cadastrado

1. **Enviar mensagem:**
   ```
   Gastei R$ 50 no restaurante
   ```

2. **Verificar no N8N:**
   - Nó "Processar Mensagem - Sistema" deve retornar:
     - `userRegistered: true`
     - `requiresConfirmation: true`
     - `response: "✅ Entendi! Confirmar..."`

3. **Resultado:** Mensagem de confirmação enviada

### Teste 2: Usuário NÃO Cadastrado

1. **Enviar mensagem de número não cadastrado:**
   ```
   Gastei R$ 50 no restaurante
   ```

2. **Verificar no N8N:**
   - Nó "Processar Mensagem - Sistema" deve retornar:
     - `userRegistered: false`
     - `requiresConfirmation: false`
     - `response: "❌ Você não está cadastrado..."`

3. **Resultado:** Mensagem "Não cadastrado" enviada

## 📝 Checklist de Uso

- [x] Nó "Processar Mensagem - Sistema" já está adicionado
- [x] Validação automática já está funcionando
- [ ] (Opcional) Adicionar IF para verificar `userRegistered`
- [ ] (Opcional) Adicionar IF para verificar `requiresConfirmation`
- [ ] Ajustar nó de envio para usar `$json.response`
- [ ] Testar com usuário cadastrado
- [ ] Testar com usuário não cadastrado

## 🎯 Resumo Final

**Você não precisa fazer nada!** A validação já está funcionando automaticamente quando o N8N chama o endpoint.

**O que acontece:**
1. N8N chama `/api/webhooks/whatsapp`
2. Sistema valida automaticamente
3. Sistema retorna resposta (com ou sem validação)
4. N8N envia resposta ao WhatsApp

**Se quiser personalizar:**
- Use `userRegistered` para verificar se está cadastrado
- Use `requiresConfirmation` para verificar se precisa confirmação
- Use `response` para enviar a mensagem

## 🆘 Dúvidas?

**P: Preciso fazer validação no N8N?**
R: Não! A validação já está sendo feita automaticamente no sistema.

**P: Como saber se o usuário está cadastrado?**
R: Verifique o campo `userRegistered` na resposta do sistema.

**P: O que fazer se não estiver cadastrado?**
R: O sistema já retorna uma mensagem. Você pode apenas enviá-la ou personalizar.

**P: Como testar?**
R: Envie mensagem de um número cadastrado e outro não cadastrado. Veja as respostas diferentes.

