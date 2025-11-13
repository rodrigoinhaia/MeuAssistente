# 📱 Configuração de Envio de OTP via WhatsApp

## 🎯 Visão Geral

O sistema de verificação OTP envia códigos de 6 dígitos via WhatsApp. Você pode configurar de duas formas:

1. **N8N Webhook** (Recomendado) - Usa seu workflow N8N existente
2. **Evolution API** - Envio direto via Evolution API

---

## 🔧 Opção 1: N8N Webhook (Recomendado)

### Como Funciona

O sistema chama um **webhook do N8N** que você cria. O N8N recebe a requisição e envia a mensagem via WhatsApp usando sua configuração existente (Evolution API, etc.).

### Passo a Passo

#### 1. Criar Webhook no N8N

1. Acesse seu N8N
2. Crie um novo workflow ou edite um existente
3. Adicione um nó **Webhook** como trigger
4. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `/whatsapp-send` (ou qualquer nome)
   - **Response Mode**: `Last Node`
5. Salve o workflow e copie a URL do webhook

#### 2. Adicionar Nó para Processar Dados

Após o Webhook, adicione um nó **Code** ou **Function** para processar os dados:

**Entrada esperada:**
```json
{
  "phoneNumber": "5511999999999",
  "message": "Seu código de verificação: 123456",
  "familyId": "uuid-da-familia" // opcional
}
```

#### 3. Adicionar Nó para Enviar WhatsApp

Adicione o nó que envia mensagem via WhatsApp (Evolution API, etc.):

**Configuração exemplo (Evolution API):**
- **URL**: `https://api-whats.sdbr.app/message/sendText/{{ $env.INSTANCE_NAME }}`
- **Method**: `POST`
- **Headers**:
  - `apikey`: `{{ $env.EVOLUTION_API_KEY }}`
- **Body**:
```json
{
  "number": "={{ $json.phoneNumber }}",
  "text": "={{ $json.message }}"
}
```

#### 4. Configurar Variável de Ambiente

No seu `.env` do sistema:
```env
N8N_WHATSAPP_WEBHOOK_URL=https://seu-n8n.com/webhook/whatsapp-send
```

### Exemplo de Workflow N8N

```
Webhook (POST /whatsapp-send)
  ↓
Function (processar dados)
  ↓
HTTP Request (Evolution API - enviar mensagem)
  ↓
Respond to Webhook (retornar sucesso)
```

---

## 🔧 Opção 2: Evolution API Direta

### Como Funciona

O sistema chama **diretamente** a Evolution API para enviar mensagens, sem passar pelo N8N.

### Configuração

No seu `.env`:
```env
EVOLUTION_API_URL=https://api-whats.sdbr.app
EVOLUTION_API_KEY=sua-api-key-aqui
EVOLUTION_INSTANCE_NAME=nome-da-sua-instancia
```

### Vantagens

- ✅ Mais simples (não precisa criar workflow no N8N)
- ✅ Mais rápido (menos latência)
- ✅ Menos pontos de falha

### Desvantagens

- ❌ Não usa a lógica do seu workflow N8N existente
- ❌ Não tem logs centralizados no N8N

---

## 📋 Rota de API Alternativa

Se preferir, você pode chamar diretamente a rota de API:

**POST** `/api/whatsapp/send`

**Body:**
```json
{
  "phoneNumber": "5511999999999",
  "message": "Sua mensagem aqui",
  "familyId": "uuid-opcional"
}
```

**Headers:**
```
Content-Type: application/json
```

---

## 🧪 Teste

### Testar via cURL

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "message": "Teste de envio OTP"
  }'
```

### Testar no N8N

1. Execute o workflow manualmente
2. Envie um POST para o webhook com os dados de exemplo
3. Verifique se a mensagem chegou no WhatsApp

---

## 🔍 Troubleshooting

### Mensagem não está sendo enviada

1. **Verifique os logs do sistema:**
   - Procure por `[SEND_WHATSAPP]` nos logs
   - Verifique se há erros de conexão

2. **Verifique as variáveis de ambiente:**
   ```bash
   echo $N8N_WHATSAPP_WEBHOOK_URL
   # ou
   echo $EVOLUTION_API_URL
   ```

3. **Teste o webhook do N8N diretamente:**
   ```bash
   curl -X POST https://seu-n8n.com/webhook/whatsapp-send \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"5511999999999","message":"Teste"}'
   ```

4. **Verifique se o número está no formato correto:**
   - Formato esperado: `5511999999999` (com código do país, sem +)
   - O sistema normaliza automaticamente

---

## 📝 Notas Importantes

- ⚠️ O número de telefone deve incluir o código do país (ex: `5511999999999` para Brasil)
- ⚠️ O sistema normaliza o número automaticamente (remove caracteres especiais)
- ⚠️ Se ambos os métodos estiverem configurados, o N8N tem prioridade
- ⚠️ Se nenhum método estiver configurado, o sistema loga um aviso mas não falha

---

## 🎯 Recomendação

**Para produção:** Use N8N Webhook**
- Centraliza toda a lógica de envio
- Permite adicionar logs, retry, etc.
- Integra com outros sistemas facilmente

**Para desenvolvimento/testes:** Use Evolution API Direta
- Mais rápido de configurar
- Menos dependências

