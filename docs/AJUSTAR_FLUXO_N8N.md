# 🔧 Como Ajustar o Fluxo N8N para se Comunicar com o Sistema

## ✅ Resumo

**Sim, o código foi implementado!** Todos os componentes estão prontos em:
- `src/lib/whatsapp/` - Processadores e lógica
- `src/app/api/webhooks/whatsapp/route.ts` - API para receber mensagens
- `src/app/api/webhooks/n8n/route.ts` - Webhook do N8N (atualizado)

**Agora precisamos ajustar o workflow N8N** para chamar o sistema.

## 🎯 O que Fazer

### Opção 1: Atualizar Manualmente no N8N (Recomendado)

1. **Acesse o N8N** e abra o workflow `jydoDAnOVojEGX0D` (MeuAssistente)

2. **Encontre o nó "Edit Fields"** que extrai:
   - `telefoneCliente`
   - `mensagem`
   - `tipoMensagem`

3. **Adicione um novo nó HTTP Request** após "Edit Fields":

   **Nome:** `Processar Mensagem - Sistema`
   
   **Tipo:** HTTP Request
   
   **Configuração:**
   - **Método:** POST
   - **URL:** `{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp`
     - Ou use diretamente: `http://localhost:3000/api/webhooks/whatsapp` (dev)
     - Ou: `https://seu-dominio.com/api/webhooks/whatsapp` (prod)
   
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

4. **Adicione um nó IF** após "Processar Mensagem - Sistema":

   **Nome:** `Verificar Confirmação`
   
   **Condição:**
   ```
   {{ $json.requiresConfirmation }} === true
   ```

5. **Ajuste o fluxo de envio:**

   - **Se `requiresConfirmation === true`**: 
     - Salvar contexto no Redis (já existe)
     - Enviar mensagem de confirmação
     - Aguardar resposta do usuário
   
   - **Se `requiresConfirmation === false`**:
     - Enviar resposta direta

6. **Use a resposta do sistema:**

   No nó de envio de mensagem (Evolution API), use:
   ```
   {{ $('Processar Mensagem - Sistema').item.json.response }}
   ```

### Opção 2: Usar Script de Atualização

Execute o script (ainda precisa de ajustes manuais):

```bash
npx tsx scripts/update-n8n-workflow.ts
```

## 📊 Fluxo Completo Sugerido

```
Webhook (WhatsApp)
  ↓
Edit Fields (extrai dados)
  ↓
Processar Mensagem - Sistema (HTTP Request)
  ↓
Verificar Confirmação (IF)
  ├─ SIM (requiresConfirmation = true)
  │   ↓
  │   Salvar Contexto Pendente (Redis)
  │   ↓
  │   Enviar Mensagem de Confirmação
  │   ↓
  │   Aguardar Resposta (Wait)
  │   ↓
  │   Processar Resposta (chamar novamente /api/webhooks/whatsapp)
  │   ↓
  │   Enviar Resposta Final
  │
  └─ NÃO (requiresConfirmation = false)
      ↓
      Enviar Resposta Direta
```

## 🔍 Exemplo de Resposta do Sistema

**Quando precisa confirmação:**
```json
{
  "status": "success",
  "response": "✅ Entendi! Confirmar:\n\n💰 Despesa: R$ 50,00\n🏷 Categoria: Alimentação\n📅 Data: Hoje às 14:30\n\nEscolha uma opção:\n✅ Confirmar | ✏️ Editar | ❌ Cancelar",
  "requiresConfirmation": true,
  "action": "transaction"
}
```

**Quando não precisa:**
```json
{
  "status": "success",
  "response": "✅ Transação registrada com sucesso!\n💰 R$ 50,00",
  "requiresConfirmation": false,
  "action": "transaction"
}
```

## ⚙️ Variáveis de Ambiente no N8N

Configure no N8N:

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
```

## 🧪 Testar

1. **Enviar mensagem de teste:**
   ```
   "Gastei R$ 50 no restaurante"
   ```

2. **Verificar no N8N:**
   - O nó "Processar Mensagem - Sistema" deve retornar `requiresConfirmation: true`
   - A resposta deve conter a mensagem de confirmação

3. **Responder "Confirmar"**
   - O sistema deve processar e retornar sucesso

## 📝 Checklist

- [ ] Adicionar nó HTTP Request "Processar Mensagem - Sistema"
- [ ] Configurar URL, headers e body corretamente
- [ ] Adicionar nó IF "Verificar Confirmação"
- [ ] Ajustar nó de envio para usar `$json.response`
- [ ] Implementar lógica de confirmação (se necessário)
- [ ] Configurar variáveis de ambiente no N8N
- [ ] Testar fluxo completo
- [ ] Testar confirmação de transação
- [ ] Testar confirmação de compromisso

## 🆘 Problemas Comuns

### Erro 401 (Não autorizado)
- Verificar se `WHATSAPP_WEBHOOK_SECRET` está configurado
- Verificar se o header Authorization está correto

### Erro 404 (Não encontrado)
- Verificar se a URL está correta
- Verificar se o servidor está rodando

### Resposta vazia
- Verificar se os campos `phoneNumber` e `message` estão sendo enviados
- Verificar logs do sistema

## 📚 Documentação Relacionada

- **Sistema implementado:** `docs/FLUXO_WHATSAPP_IMPLEMENTADO.md`
- **API do sistema:** `src/app/api/webhooks/whatsapp/route.ts`
- **Processador:** `src/lib/whatsapp/message-processor.ts`

