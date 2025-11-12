# 🔧 Ajuste Completo do Fluxo N8N - Passo a Passo

## ⚠️ Situação Atual

O workflow `jydoDAnOVojEGX0D` tem alguns problemas estruturais pré-existentes (nós desconectados). Vou adicionar o nó de integração e você precisará fazer alguns ajustes manuais.

## ✅ O que foi feito

Adicionei o nó **"Processar Mensagem - Sistema"** ao workflow. Agora você precisa conectá-lo manualmente.

## 📋 Passo a Passo para Ajustar

### 1. Abrir o Workflow no N8N

1. Acesse o N8N
2. Abra o workflow `jydoDAnOVojEGX0D` (MeuAssistente)
3. Localize o nó **"Processar Mensagem - Sistema"** (deve estar próximo ao "Edit Fields")

### 2. Conectar o Nó

**Opção A: Substituir a conexão (Recomendado)**

1. **Remover** a conexão entre "Edit Fields" → "Switch"
2. **Criar** conexão: "Edit Fields" → "Processar Mensagem - Sistema"
3. **Criar** conexão: "Processar Mensagem - Sistema" → "Switch"

**Fluxo resultante:**
```
Edit Fields
  ↓
Processar Mensagem - Sistema (chama /api/webhooks/whatsapp)
  ↓
Switch (continua o fluxo normal)
```

**Opção B: Bifurcar (Manter ambos)**

1. **Manter** a conexão "Edit Fields" → "Switch"
2. **Criar** conexão adicional: "Edit Fields" → "Processar Mensagem - Sistema"
3. **Criar** conexão: "Processar Mensagem - Sistema" → "Switch"

### 3. Ajustar o Nó de Resposta

No nó **"Resposta Texto"** (ou onde você envia a resposta), ajuste para usar a resposta do sistema:

**Antes:**
```
{{ $item("0").$node["Loop Over Items"].json["messages"] }}
```

**Depois (se usar o sistema):**
```
{{ $('Processar Mensagem - Sistema').item.json.response }}
```

**Ou manter ambos (fallback):**
```
{{ $('Processar Mensagem - Sistema').item.json.response || $item("0").$node["Loop Over Items"].json["messages"] }}
```

### 4. Configurar Variáveis de Ambiente no N8N

No N8N, configure as variáveis de ambiente:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
# ou para desenvolvimento:
# NEXT_PUBLIC_APP_URL=http://localhost:3000

WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
```

### 5. Verificar Configuração do Nó

O nó **"Processar Mensagem - Sistema"** já está configurado com:

- **URL:** `{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp`
- **Método:** POST
- **Headers:**
  - `Authorization: Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET }}`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "phoneNumber": "={{ $json.telefoneCliente }}",
    "message": "={{ $json.mensagem }}",
    "messageType": "={{ $json.tipoMensagem || 'text' }}"
  }
  ```

## 🧪 Testar

1. **Ative o workflow** no N8N
2. **Envie uma mensagem de teste** via WhatsApp:
   ```
   Gastei R$ 50 no restaurante
   ```
3. **Verifique no N8N:**
   - O nó "Processar Mensagem - Sistema" deve executar
   - Deve retornar `requiresConfirmation: true`
   - A resposta deve conter a mensagem de confirmação

4. **Verifique a resposta:**
   - Deve aparecer a mensagem de confirmação formatada
   - Com opções: ✅ Confirmar | ✏️ Editar | ❌ Cancelar

## 🔄 Fluxo de Confirmação

Quando o usuário responder "Confirmar", "Sim", etc.:

1. O workflow recebe a resposta
2. Chama novamente "Processar Mensagem - Sistema"
3. O sistema processa a confirmação
4. Retorna mensagem de sucesso
5. Envia ao usuário

## 📊 Estrutura do Nó Adicionado

```json
{
  "name": "Processar Mensagem - Sistema",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp",
    "headers": {
      "Authorization": "Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET }}",
      "Content-Type": "application/json"
    },
    "body": {
      "phoneNumber": "={{ $json.telefoneCliente }}",
      "message": "={{ $json.mensagem }}",
      "messageType": "={{ $json.tipoMensagem || 'text' }}"
    }
  }
}
```

## 🐛 Problemas Comuns

### Erro 401 (Não autorizado)
- Verificar se `WHATSAPP_WEBHOOK_SECRET` está configurado
- Verificar se o header Authorization está correto

### Erro 404 (Não encontrado)
- Verificar se `NEXT_PUBLIC_APP_URL` está correto
- Verificar se o servidor está rodando

### Resposta vazia
- Verificar se `telefoneCliente` e `mensagem` estão sendo enviados
- Verificar logs do sistema

### Workflow não executa
- Verificar se o workflow está ativo
- Verificar se o webhook está configurado corretamente

## ✅ Checklist Final

- [ ] Nó "Processar Mensagem - Sistema" adicionado
- [ ] Conexões configuradas (Edit Fields → Processar → Switch)
- [ ] Variáveis de ambiente configuradas no N8N
- [ ] Nó de resposta ajustado para usar `$json.response`
- [ ] Workflow testado com mensagem de exemplo
- [ ] Fluxo de confirmação testado

## 📚 Próximos Passos

Após conectar o nó:

1. **Testar** com mensagens reais
2. **Ajustar** a lógica de confirmação se necessário
3. **Monitorar** logs do sistema
4. **Otimizar** conforme necessário

## 🆘 Suporte

Se tiver problemas:

1. Verifique os logs do N8N
2. Verifique os logs do sistema (`/api/webhooks/whatsapp`)
3. Teste a API diretamente:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/whatsapp \
     -H "Authorization: Bearer seu-secret" \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "+5511999999999",
       "message": "Gastei R$ 50 no restaurante"
     }'
   ```

