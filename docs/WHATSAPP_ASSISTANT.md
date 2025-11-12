# Assistente WhatsApp - Documentação Técnica

## 📋 Visão Geral

Sistema completo de processamento de mensagens do WhatsApp com:
- ✅ Detecção automática de intents (NLP + Regex)
- ✅ Gerenciamento de contexto/sessão (Redis)
- ✅ Fluxo de confirmação em 2 etapas
- ✅ Agendamento de mensagens proativas
- ✅ Resumo semanal automático
- ✅ Piadas com controle de frequência
- ✅ Validação de datas em linguagem natural

## 🏗️ Arquitetura

```
WhatsApp → Webhook → Message Processor → Intent Detection → Confirmation Flow → Database
                ↓
         Session Context (Redis)
                ↓
         Scheduled Messages (Cron)
```

## 📁 Estrutura de Arquivos

```
src/lib/whatsapp/
├── session-context.ts      # Gerenciamento de contexto/sessão
├── intent-detection.ts     # Detecção de intents (Regex + LLM)
├── date-parser.ts          # Parsing de datas em linguagem natural
├── confirmation-flow.ts    # Fluxo de confirmação em 2 etapas
├── message-processor.ts    # Processador principal
├── weekly-summary.ts       # Geração de resumo semanal
├── scheduled-messages.ts   # Mensagens proativas agendadas
└── jokes.ts                # Piadas e mensagens motivacionais

src/app/api/
├── webhooks/
│   ├── whatsapp/route.ts    # Webhook para receber mensagens
│   └── n8n/route.ts        # Webhook do N8N (atualizado)
└── cron/
    ├── daily-summary/       # Resumo diário (08:00)
    ├── weekly-summary/      # Resumo semanal (Domingo 20:00)
    └── reminders/          # Lembretes (a cada 5 min)
```

## 🔧 Componentes Principais

### 1. Session Context (`session-context.ts`)

Gerencia o estado da sessão do usuário no Redis:

```typescript
interface SessionContext {
  userId: string
  tenantId: string
  phoneNumber: string
  lastInteraction: Date
  pendingTransaction?: Partial<PendingTransaction>
  pendingAppointment?: Partial<PendingAppointment>
  awaitingConfirmation?: 'transaction' | 'appointment'
  lastJokeAt?: Date
  messageCount: number
}
```

**Funcionalidades:**
- Armazena contexto por 24h (TTL)
- Limpa contexto após 30min de inatividade
- Controla frequência de piadas (máximo 1 a cada 4 horas)

### 2. Intent Detection (`intent-detection.ts`)

Detecta a intenção do usuário usando Regex (rápido) ou LLM (opcional):

**Intents suportados:**
- `expense` - Registrar despesa
- `income` - Registrar receita
- `appointment` - Agendar compromisso
- `report` - Ver relatório
- `confirmation` - Confirmar ação
- `cancel` - Cancelar ação
- `edit` - Editar ação

**Exemplos:**
- "Gastei R$ 50 no restaurante" → `expense`
- "Recebi R$ 1000 de salário" → `income`
- "Agendar reunião dia 20/09 às 15h" → `appointment`
- "Ver meus gastos" → `report`

### 3. Date Parser (`date-parser.ts`)

Usa `chrono-node` para parsing de datas em linguagem natural:

**Exemplos:**
- "dia 20/09 às 15h" → `2025-09-20T15:00:00`
- "amanhã às 10h" → Data de amanhã às 10:00
- "próxima segunda" → Próxima segunda-feira

### 4. Confirmation Flow (`confirmation-flow.ts`)

**NUNCA salva sem confirmação do usuário!**

Fluxo:
1. Usuário envia: "Gastei R$ 80 no restaurante"
2. Sistema cria transação pendente
3. Sistema envia mensagem de confirmação com botões
4. Usuário confirma/cancela/edita
5. Sistema salva no banco apenas após confirmação

**Mensagem de confirmação:**
```
✅ Entendi! Confirmar:

💰 Despesa: R$ 80,00
🏷 Categoria: Alimentação
📅 Data: Hoje às 14:30
📝 Descrição: Restaurante

Escolha uma opção:
✅ Confirmar | ✏️ Editar | ❌ Cancelar
```

### 5. Message Processor (`message-processor.ts`)

Orquestra todo o fluxo:

1. Inicializa contexto se necessário
2. Detecta intent
3. Processa baseado no intent
4. Cria confirmação se necessário
5. Retorna resposta formatada

### 6. Weekly Summary (`weekly-summary.ts`)

Gera resumo semanal completo:

- Receitas da semana
- Despesas da semana
- Saldo (positivo/negativo)
- Top 3 categorias de gastos
- Próximos compromissos

### 7. Scheduled Messages (`scheduled-messages.ts`)

**Resumo Diário (08:00):**
- Compromissos do dia
- Resumo financeiro do dia anterior

**Lembretes (30min antes):**
- Lembrete automático de compromissos

**Resumo Semanal (Domingo 20:00):**
- Resumo completo da semana

## 🔌 APIs

### POST `/api/webhooks/whatsapp`

Recebe mensagens do WhatsApp:

**Request:**
```json
{
  "phoneNumber": "+5511999999999",
  "message": "Gastei R$ 50 no restaurante",
  "messageType": "text"
}
```

**Response:**
```json
{
  "status": "success",
  "response": "✅ Entendi! Confirmar:...",
  "requiresConfirmation": true,
  "action": "transaction"
}
```

### GET `/api/cron/daily-summary`

Executa resumo diário (chamado por cron às 08:00)

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

### GET `/api/cron/weekly-summary`

Executa resumo semanal (chamado por cron aos domingos às 20:00)

### GET `/api/cron/reminders`

Processa lembretes (chamado por cron a cada 5 minutos)

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Redis (obrigatório)
REDIS_URL=redis://host:port

# Cron Secret (para proteger endpoints de cron)
CRON_SECRET=seu-secret-aqui

# WhatsApp Webhook Secret
WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
```

### Configurar Cron Jobs

**EasyPanel/Vercel:**
- Resumo Diário: `0 8 * * *` → `GET /api/cron/daily-summary`
- Resumo Semanal: `0 20 * * 0` → `GET /api/cron/weekly-summary`
- Lembretes: `*/5 * * * *` → `GET /api/cron/reminders`

## 🚀 Fluxo Completo

### Exemplo: Registrar Despesa

1. **Usuário envia:** "Gastei R$ 50 no restaurante"
2. **Sistema detecta:** Intent `expense` com `amount: 50`, `category: alimentação`
3. **Sistema salva:** Transação pendente no contexto Redis
4. **Sistema envia:** Mensagem de confirmação
5. **Usuário confirma:** "Confirmar" ou "Sim"
6. **Sistema salva:** Transação no banco de dados
7. **Sistema responde:** "✅ Transação registrada com sucesso!"

### Exemplo: Agendar Compromisso

1. **Usuário envia:** "Agendar reunião dia 20/09 às 15h"
2. **Sistema detecta:** Intent `appointment` com `date: 2025-09-20T15:00:00`
3. **Sistema salva:** Compromisso pendente no contexto
4. **Sistema envia:** Mensagem de confirmação
5. **Usuário confirma:** "Confirmar"
6. **Sistema salva:** Compromisso no banco
7. **Sistema agenda:** Lembrete 30min antes

## 📝 Próximos Passos

### Implementações Pendentes

1. **OCR para Imagens:**
   - Usar Tesseract.js ou Google Vision API
   - Processar recibos e notas fiscais

2. **Transcrição de Áudio:**
   - Usar Whisper API ou Google Speech-to-Text
   - Processar mensagens de voz

3. **Envio de Mensagens:**
   - Integrar com WhatsApp Business API
   - Implementar `sendWhatsAppMessage()`

4. **BullMQ para Agendamento:**
   - Substituir cron jobs por filas
   - Melhor controle de retry e falhas

5. **LLM para Detecção:**
   - Integrar OpenAI/Claude para melhor precisão
   - Fallback para Regex quando LLM não disponível

## 🧪 Testes

### Teste Manual

```bash
# Testar webhook
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-secret" \
  -d '{
    "phoneNumber": "+5511999999999",
    "message": "Gastei R$ 50 no restaurante"
  }'
```

### Teste de Integração

```bash
# Simular fluxo completo
POST /api/webhooks/whatsapp
  → processWhatsAppMessage()
  → detectIntent()
  → savePendingTransaction()
  → confirmTransaction()
```

## 📚 Referências

- [chrono-node](https://github.com/wanasit/chrono) - Parsing de datas
- [date-fns](https://date-fns.org/) - Manipulação de datas
- [ioredis](https://github.com/redis/ioredis) - Cliente Redis
- [Prisma](https://www.prisma.io/) - ORM

