# Integração do Workflow N8N com o Sistema

## 📋 Situação Atual

O workflow `jydoDAnOVojEGX0D` (MeuAssistente) já existe e processa mensagens do WhatsApp, mas **não está integrado com o sistema** que acabamos de criar.

## 🎯 O que precisa ser feito

Adicionar um nó **HTTP Request** no workflow para chamar o sistema `/api/webhooks/whatsapp` e processar a mensagem usando o novo processador.

## 🔧 Ajustes Necessários no Workflow

### 1. Adicionar Nó HTTP Request para Processar Mensagem

**Localização:** Após o nó "Edit Fields" (que extrai `telefoneCliente`, `mensagem`, etc.)

**Configuração do Nó:**

```json
{
  "name": "Processar Mensagem - Sistema",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "parameters": {
    "method": "POST",
    "url": "={{ $env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }}/api/webhooks/whatsapp",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "phoneNumber",
          "value": "={{ $json.telefoneCliente }}"
        },
        {
          "name": "message",
          "value": "={{ $json.mensagem }}"
        },
        {
          "name": "messageType",
          "value": "={{ $json.tipoMensagem || 'text' }}"
        }
      ]
    },
    "options": {}
  }
}
```

### 2. Modificar o Fluxo

**Fluxo sugerido:**

```
Webhook (WhatsApp)
  ↓
Edit Fields (extrai telefoneCliente, mensagem, tipoMensagem)
  ↓
Processar Mensagem - Sistema (HTTP Request → /api/webhooks/whatsapp)
  ↓
IF (requiresConfirmation === true?)
  ├─ SIM → Enviar mensagem de confirmação + botões
  └─ NÃO → Enviar resposta direta
  ↓
Resposta Texto (Evolution API)
```

### 3. Adicionar Lógica de Confirmação

Se `requiresConfirmation === true`, o sistema retorna uma mensagem que precisa de confirmação. Nesse caso:

1. **Salvar contexto no Redis** (já existe no workflow)
2. **Enviar mensagem com botões** (se Evolution API suportar)
3. **Aguardar resposta do usuário**
4. **Processar confirmação** chamando novamente `/api/webhooks/whatsapp` com a resposta

## 📝 Exemplo de Implementação

### Nó 1: Processar Mensagem

**Nome:** `Processar Mensagem - Sistema`

**Tipo:** HTTP Request

**URL:** `{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp`

**Método:** POST

**Headers:**
```
Authorization: Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET }}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "phoneNumber": "={{ $json.telefoneCliente }}",
  "message": "={{ $json.mensagem }}",
  "messageType": "={{ $json.tipoMensagem || 'text' }}"
}
```

**Resposta esperada:**
```json
{
  "status": "success",
  "response": "✅ Entendi! Confirmar:...",
  "requiresConfirmation": true,
  "action": "transaction"
}
```

### Nó 2: Verificar Se Precisa Confirmação

**Nome:** `Verificar Confirmação`

**Tipo:** IF

**Condição:**
```
{{ $json.requiresConfirmation }} === true
```

### Nó 3: Salvar Contexto (se precisa confirmação)

**Nome:** `Salvar Contexto Pendente`

**Tipo:** Set (Redis)

**Operação:** SET

**Key:** `session:{{ $json.telefoneCliente }}:pending`

**Value:**
```json
{
  "response": "={{ $('Processar Mensagem - Sistema').item.json.response }}",
  "action": "={{ $('Processar Mensagem - Sistema').item.json.action }}",
  "timestamp": "={{ $now }}"
}
```

**TTL:** 1800 (30 minutos)

### Nó 4: Enviar Resposta

**Nome:** `Enviar Resposta WhatsApp`

**Tipo:** HTTP Request (Evolution API)

**URL:** `https://api-whats.sdbr.app/message/sendText/{{ $json.nomeInstancia }}`

**Headers:**
```
apikey: {{ $('Webhook').item.json.body.apikey }}
```

**Body:**
```json
{
  "number": "={{ $json.telefoneCliente }}",
  "text": "={{ $('Processar Mensagem - Sistema').item.json.response }}"
}
```

## 🔄 Fluxo de Confirmação

Quando o usuário responde "Confirmar", "Sim", "Cancelar", etc.:

1. **Webhook recebe** a resposta
2. **Buscar contexto pendente** no Redis
3. **Chamar novamente** `/api/webhooks/whatsapp` com a resposta
4. **Sistema processa** e retorna resultado
5. **Enviar resposta final** ao usuário

## 🛠️ Implementação no N8N

### Opção 1: Usar o MCP do N8N para Atualizar

Você pode usar as ferramentas MCP para atualizar o workflow programaticamente.

### Opção 2: Atualizar Manualmente

1. Abra o workflow no N8N
2. Adicione o nó HTTP Request após "Edit Fields"
3. Configure conforme o exemplo acima
4. Conecte os nós conforme o fluxo sugerido
5. Teste com uma mensagem de exemplo

## 📋 Checklist de Integração

- [ ] Adicionar nó HTTP Request para `/api/webhooks/whatsapp`
- [ ] Configurar headers de autenticação
- [ ] Mapear campos corretos (phoneNumber, message, messageType)
- [ ] Adicionar lógica IF para `requiresConfirmation`
- [ ] Implementar salvamento de contexto pendente
- [ ] Ajustar nó de envio de resposta
- [ ] Testar fluxo completo
- [ ] Testar confirmação de transação
- [ ] Testar confirmação de compromisso
- [ ] Testar cancelamento

## 🔍 Variáveis de Ambiente Necessárias

No N8N, configure:

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
```

## 🧪 Teste Manual

1. Enviar mensagem: "Gastei R$ 50 no restaurante"
2. Verificar se o sistema retorna mensagem de confirmação
3. Responder "Confirmar"
4. Verificar se a transação foi salva no banco

## 📚 Referências

- Documentação do sistema: `docs/WHATSAPP_ASSISTANT.md`
- API do sistema: `src/app/api/webhooks/whatsapp/route.ts`
- Processador: `src/lib/whatsapp/message-processor.ts`

