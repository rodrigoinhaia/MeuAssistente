# Configuração do N8N - MeuAssistente

## Visão Geral

O N8N é usado para processar mensagens do WhatsApp, sincronizar com Google Calendar/Tasks e executar automações inteligentes.

## Configuração Inicial

### 1. Instalação via Docker (Recomendado)

O projeto já inclui configuração do N8N no `docker-compose.yml`:

```bash
docker-compose up -d n8n
```

O N8N estará disponível em: `http://localhost:5678`

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `admin123`

⚠️ **IMPORTANTE**: Altere essas credenciais em produção!

### 2. Configuração no Sistema

1. Acesse o dashboard: `/dashboard/integrations`
2. Role até a seção "N8N"
3. Preencha:
   - **URL do N8N**: `http://localhost:5678` (ou sua URL de produção)
   - **API Key**: Gere no N8N (Settings > API)
   - **Webhook URL**: `http://localhost:3000/api/webhooks/n8n` (ou sua URL de produção)

### 3. Gerar API Key no N8N

1. Acesse o N8N: `http://localhost:5678`
2. Vá em **Settings** > **API**
3. Clique em **Create API Key**
4. Copie a chave gerada
5. Cole no formulário de integração

## Workflows Básicos

### Workflow 1: Processamento de Mensagens WhatsApp

**Objetivo**: Processar mensagens recebidas via WhatsApp e criar transações/compromissos automaticamente.

**Estrutura**:
1. **Webhook Trigger** - Recebe mensagem do WhatsApp
2. **Function Node** - Identifica família por número de telefone
3. **IF Node** - Verifica tipo de mensagem (transação, compromisso, etc.)
4. **HTTP Request** - Chama API do sistema para criar registro
5. **Webhook Response** - Retorna confirmação

**Configuração do Webhook**:
- URL: `http://localhost:5678/webhook/whatsapp`
- Método: POST
- Headers: `Content-Type: application/json`

**Payload esperado**:
```json
{
  "phoneNumber": "+5511999999999",
  "message": "Gastei R$ 50,00 com almoço",
  "timestamp": "2025-01-20T10:00:00Z"
}
```

**Resposta do Webhook**:
```json
{
  "workflowId": "workflow-id",
  "workflowName": "Processar WhatsApp",
  "phoneNumber": "+5511999999999",
  "type": "whatsapp",
  "data": {
    "transactionId": "trans-id",
    "amount": 50.00,
    "description": "Almoço"
  },
  "status": "success",
  "message": "Transação criada com sucesso"
}
```

### Workflow 2: Sincronização Google Calendar

**Objetivo**: Sincronizar eventos do Google Calendar com compromissos do sistema.

**Estrutura**:
1. **Cron Trigger** - Executa a cada hora
2. **Google Calendar Node** - Busca eventos novos/atualizados
3. **Function Node** - Mapeia eventos para formato do sistema
4. **HTTP Request** - Chama API para criar/atualizar compromissos
5. **Error Handler** - Trata erros

### Workflow 3: Sincronização Google Tasks

**Objetivo**: Sincronizar tarefas do Google Tasks com o sistema.

**Estrutura**:
1. **Cron Trigger** - Executa a cada 30 minutos
2. **Google Tasks Node** - Busca tarefas novas/atualizadas
3. **Function Node** - Mapeia tarefas para formato do sistema
4. **HTTP Request** - Chama API para criar/atualizar tarefas

## Variáveis de Ambiente

Adicione ao `.env`:

```env
# N8N Configuration
N8N_URL=http://localhost:5678
N8N_API_KEY=sua-api-key-aqui
N8N_WEBHOOK_SECRET=seu-secret-aqui
```

## Webhook do Sistema

O sistema expõe um webhook em `/api/webhooks/n8n` para receber dados dos workflows do N8N.

**Autenticação**: 
- Header: `Authorization: Bearer {N8N_WEBHOOK_SECRET}`

**Payload esperado**:
```json
{
  "workflowId": "workflow-id",
  "workflowName": "Nome do Workflow",
  "familyId": "family-id",
  "phoneNumber": "+5511999999999",
  "type": "whatsapp",
  "data": {},
  "status": "success",
  "message": "Mensagem de sucesso"
}
```

## Identificação de Famílias

O sistema identifica famílias por número de telefone. Quando o N8N processa uma mensagem:

1. Extrai o número de telefone do remetente
2. Busca a família correspondente no banco
3. Processa a mensagem no contexto da família encontrada

## Logs e Monitoramento

Todos os processamentos são registrados em `ProcessingLog`:
- Tipo: `whatsapp`, `google_calendar`, `google_tasks`, `ai`
- Status: `success`, `error`, `warning`
- Dados: JSON com detalhes do processamento

Acesse os logs em: `/dashboard/n8n`

## Próximos Passos

1. ✅ Configurar N8N básico
2. ⏳ Criar workflows de exemplo
3. ⏳ Implementar processamento de IA para categorização
4. ⏳ Configurar sincronização bidirecional Google Calendar/Tasks
5. ⏳ Implementar automações de lembretes

## Troubleshooting

### N8N não conecta
- Verifique se o N8N está rodando: `docker ps | grep n8n`
- Verifique a URL e porta: `http://localhost:5678`
- Verifique a API Key no N8N

### Webhook não recebe dados
- Verifique se o webhook está configurado corretamente no workflow
- Verifique o `N8N_WEBHOOK_SECRET` no `.env`
- Verifique os logs do sistema: `/dashboard/n8n`

### Workflows não executam
- Verifique se o workflow está ativo no N8N
- Verifique os logs de execução no N8N
- Verifique os logs do sistema em `ProcessingLog`

