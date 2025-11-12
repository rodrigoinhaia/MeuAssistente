# 🔄 Fluxo Completo: N8N → Sistema → WhatsApp

## 📋 Visão Geral

Este documento explica **exatamente** como o fluxo funciona do início ao fim, incluindo a validação de usuário.

## 🎯 Fluxo Completo

```
┌─────────────┐
│  WhatsApp   │ Envia mensagem
└──────┬──────┘
       │
       ↓
┌─────────────┐
│     N8N    │ Recebe via Webhook
│  Workflow  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────┐
│  Edit Fields            │ Extrai: telefoneCliente, mensagem, tipoMensagem
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────┐
│  Processar Mensagem     │ HTTP Request → /api/webhooks/whatsapp
│  - Sistema              │ Body: { phoneNumber, message, messageType }
└──────┬──────────────────┘
       │
       ↓
┌─────────────────────────┐
│  Sistema (Backend)      │
│  /api/webhooks/whatsapp │
└──────┬──────────────────┘
       │
       ├─→ 1. Normalizar telefone
       │      "5511999999999@s.whatsapp.net" → "5511999999999"
       │
       ├─→ 2. Buscar no banco
       │      ├─ User.phone → Encontrou? ✅
       │      └─ Family.phoneNumber → Encontrou? ✅ (usa OWNER)
       │
       ├─→ 3. Validar
       │      ├─ Não encontrou? → Retorna mensagem "Não cadastrado" ❌
       │      └─ Encontrou? → Processa mensagem ✅
       │
       └─→ 4. Retornar resposta
              {
                response: "...",
                requiresConfirmation: true/false,
                userRegistered: true/false
              }
       │
       ↓
┌─────────────────────────┐
│     N8N                 │ Recebe resposta
│  Workflow               │
└──────┬──────────────────┘
       │
       ├─→ IF (requiresConfirmation === true)
       │     ↓
       │     Salvar contexto + Enviar confirmação
       │
       └─→ IF (requiresConfirmation === false)
             ↓
             Enviar resposta direta
       │
       ↓
┌─────────────┐
│  WhatsApp   │ Recebe resposta
└─────────────┘
```

## 🔍 Detalhamento de Cada Etapa

### Etapa 1: WhatsApp → N8N

**O que acontece:**
- Usuário envia mensagem no WhatsApp
- N8N recebe via Webhook (Evolution API ou similar)

**Dados recebidos:**
```json
{
  "body": {
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net"
      },
      "message": {
        "conversation": "Gastei R$ 50 no restaurante"
      }
    }
  }
}
```

### Etapa 2: N8N - Edit Fields

**O que acontece:**
- Extrai dados da mensagem
- Formata para enviar ao sistema

**Dados extraídos:**
```json
{
  "telefoneCliente": "5511999999999@s.whatsapp.net",
  "mensagem": "Gastei R$ 50 no restaurante",
  "tipoMensagem": "text"
}
```

### Etapa 3: N8N - Processar Mensagem - Sistema

**O que acontece:**
- Faz HTTP Request para `/api/webhooks/whatsapp`
- Envia dados extraídos

**Request:**
```http
POST /api/webhooks/whatsapp
Authorization: Bearer {WHATSAPP_WEBHOOK_SECRET}
Content-Type: application/json

{
  "phoneNumber": "5511999999999@s.whatsapp.net",
  "message": "Gastei R$ 50 no restaurante",
  "messageType": "text"
}
```

### Etapa 4: Sistema - Validação Automática

**O que acontece (CÓDIGO AUTOMÁTICO):**

```typescript
// 1. Normalizar telefone
const normalized = normalizePhoneNumber(phoneNumber)
// "5511999999999@s.whatsapp.net" → "5511999999999"

// 2. Buscar usuário
const identification = await identifyUserByPhone(normalized)
// Busca em User.phone
// Se não encontrar, busca em Family.phoneNumber

// 3. Validar
if (!identification) {
  // Usuário não cadastrado
  return {
    response: "❌ Você não está cadastrado...",
    userRegistered: false
  }
}

// 4. Processar mensagem
const result = await processWhatsAppMessage(...)
// Detecta intent, cria confirmação, etc.

// 5. Retornar resposta
return {
  response: result.response,
  requiresConfirmation: result.requiresConfirmation,
  userRegistered: true
}
```

**Resposta (Usuário Cadastrado):**
```json
{
  "status": "success",
  "response": "✅ Entendi! Confirmar:\n\n💰 Despesa: R$ 50,00\n🏷 Categoria: Alimentação\n📅 Data: Hoje\n\n✅ Confirmar | ✏️ Editar | ❌ Cancelar",
  "requiresConfirmation": true,
  "action": "transaction",
  "userRegistered": true
}
```

**Resposta (Usuário NÃO Cadastrado):**
```json
{
  "status": "success",
  "response": "❌ Você não está cadastrado no sistema.\n\nPara usar o MeuAssistente...",
  "requiresConfirmation": false,
  "action": "none",
  "userRegistered": false
}
```

### Etapa 5: N8N - Processar Resposta

**O que acontece:**
- Recebe resposta do sistema
- Decide o que fazer baseado na resposta

**Opção A: Verificar Confirmação**
```
IF (requiresConfirmation === true)
  → Salvar contexto no Redis
  → Enviar mensagem de confirmação
  → Aguardar resposta do usuário

IF (requiresConfirmation === false)
  → Enviar resposta direta
```

**Opção B: Verificar Cadastro (Opcional)**
```
IF (userRegistered === false)
  → Enviar mensagem "Não cadastrado"
  → Parar fluxo

IF (userRegistered === true)
  → Continuar processamento normal
```

### Etapa 6: N8N → WhatsApp

**O que acontece:**
- Envia resposta ao WhatsApp via Evolution API

**Request:**
```http
POST https://api-whats.sdbr.app/message/sendText/{instance}
apikey: {api_key}

{
  "number": "5511999999999",
  "text": "✅ Entendi! Confirmar:\n\n💰 Despesa: R$ 50,00..."
}
```

## 🎨 Exemplos Práticos

### Exemplo 1: Usuário Cadastrado - Transação

**1. Usuário envia:**
```
Gastei R$ 50 no restaurante
```

**2. N8N processa:**
- Extrai: `telefoneCliente`, `mensagem`
- Chama sistema: `/api/webhooks/whatsapp`

**3. Sistema valida:**
- ✅ Encontrou usuário no banco
- Processa mensagem
- Detecta intent: `expense`
- Cria confirmação pendente

**4. Sistema retorna:**
```json
{
  "response": "✅ Entendi! Confirmar:\n\n💰 R$ 50,00\n🏷 Alimentação\n📅 Hoje",
  "requiresConfirmation": true,
  "userRegistered": true
}
```

**5. N8N envia:**
- Mensagem de confirmação ao WhatsApp

**6. Usuário responde:**
```
Confirmar
```

**7. N8N processa novamente:**
- Chama sistema com "Confirmar"
- Sistema confirma transação
- Salva no banco

**8. Sistema retorna:**
```json
{
  "response": "✅ Transação registrada com sucesso!",
  "requiresConfirmation": false
}
```

**9. N8N envia:**
- Mensagem de sucesso

### Exemplo 2: Usuário NÃO Cadastrado

**1. Usuário envia:**
```
Gastei R$ 50 no restaurante
```

**2. N8N processa:**
- Extrai dados
- Chama sistema

**3. Sistema valida:**
- ❌ Não encontrou usuário no banco
- **NÃO processa** a mensagem

**4. Sistema retorna:**
```json
{
  "response": "❌ Você não está cadastrado no sistema...",
  "userRegistered": false,
  "requiresConfirmation": false
}
```

**5. N8N envia:**
- Mensagem "Não cadastrado"

**6. FIM** (não processa mais nada)

## 🔧 Configuração no N8N

### Variáveis de Ambiente

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
```

### Nó HTTP Request

**URL:**
```
{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp
```

**Body:**
```json
{
  "phoneNumber": "={{ $json.telefoneCliente }}",
  "message": "={{ $json.mensagem }}",
  "messageType": "={{ $json.tipoMensagem || 'text' }}"
}
```

### Usar Resposta

**No nó de envio:**
```
{{ $('Processar Mensagem - Sistema').item.json.response }}
```

## ✅ Resumo

**A validação está funcionando automaticamente!**

1. N8N chama o sistema
2. Sistema valida automaticamente
3. Sistema retorna resposta
4. N8N envia ao WhatsApp

**Você não precisa fazer validação manual no N8N!**

