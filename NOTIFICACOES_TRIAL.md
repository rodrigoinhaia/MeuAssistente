# 📧 Sistema de Notificações de Trial

## 🎯 Funcionalidades Implementadas

### 1. **Serviço de Email (Resend)**
- ✅ Integração com Resend para envio de emails
- ✅ Templates HTML responsivos e profissionais
- ✅ Suporte a múltiplos destinatários
- ✅ Fallback para modo desenvolvimento (sem API key)

### 2. **Templates de Email**
- ✅ **Trial Expirando** (2 dias antes): Aviso amigável com call-to-action
- ✅ **Trial Expirado**: Notificação de bloqueio com link para upgrade
- ✅ **Pagamento Confirmado**: Confirmação de ativação da assinatura

### 3. **APIs de Notificação**
- ✅ `POST /api/notifications/trial` - Enviar notificações manualmente
- ✅ `GET /api/notifications/trial` - Verificar estatísticas de trials
- ✅ `GET /api/cron/trial-notifications` - Cron job para execução automática

### 4. **Integração com Webhook Asaas**
- ✅ Email automático quando pagamento é confirmado
- ✅ Confirmação de ativação da assinatura

---

## ⚙️ Configuração

### **1. Variáveis de Ambiente (.env)**
```env
# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@meuassistente.com
RESEND_FROM_NAME=MeuAssistente

# URL Base (para links nos emails)
NEXTAUTH_URL=https://seudominio.com

# Cron Secret (para proteger endpoint de cron)
CRON_SECRET=seu-secret-aqui
```

### **2. Configurar Resend**
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta
3. Gere uma API Key
4. Configure o domínio de envio (opcional, mas recomendado)
5. Adicione a API Key no `.env`

### **3. Configurar Cron Job (Vercel)**
O arquivo `vercel.json` já está configurado para executar o cron diariamente às 9h.

**Alternativas:**
- **GitHub Actions**: Criar workflow que chama a API diariamente
- **Cron externo**: Usar serviços como cron-job.org
- **Node-cron**: Executar localmente (não recomendado para produção)

---

## 📧 Templates de Email

### **Trial Expirando (2 dias antes)**
- **Assunto**: `⏰ Seu trial está acabando! 2 dias restantes`
- **Conteúdo**: 
  - Saudação personalizada
  - Aviso sobre dias restantes
  - Data de expiração
  - Botão para escolher plano
  - Link direto para upgrade

### **Trial Expirado**
- **Assunto**: `🔒 Seu trial expirou - Escolha um plano para continuar`
- **Conteúdo**:
  - Notificação de bloqueio
  - Garantia de que dados estão seguros
  - Botão para escolher plano
  - Link de suporte

### **Pagamento Confirmado**
- **Assunto**: `✅ Pagamento confirmado - Assinatura ativada!`
- **Conteúdo**:
  - Confirmação de pagamento
  - Detalhes do plano
  - Valor pago
  - Próxima cobrança (se aplicável)
  - Botão para acessar dashboard

---

## 🚀 Como Usar

### **1. Enviar Notificações Manualmente**
```bash
# Enviar todas as notificações pendentes
curl -X POST https://seudominio.com/api/notifications/trial

# Enviar apenas notificações de trial expirando
curl -X POST https://seudominio.com/api/notifications/trial \
  -H "Content-Type: application/json" \
  -d '{"type": "expiring"}'

# Enviar apenas notificações de trial expirado
curl -X POST https://seudominio.com/api/notifications/trial \
  -H "Content-Type: application/json" \
  -d '{"type": "expired"}'
```

### **2. Verificar Estatísticas**
```bash
curl https://seudominio.com/api/notifications/trial
```

**Resposta:**
```json
{
  "status": "ok",
  "stats": {
    "total": 10,
    "expiring": 2,
    "expired": 1,
    "active": 7
  }
}
```

### **3. Executar Cron Job Manualmente**
```bash
curl -X GET https://seudominio.com/api/cron/trial-notifications \
  -H "Authorization: Bearer seu-cron-secret"
```

---

## 🔄 Fluxo Automático

### **Cron Job Diário (9h da manhã)**
```
1. Busca todas as assinaturas em trial
2. Para cada assinatura:
   - Se faltam 2 dias: Envia email "Trial Expirando"
   - Se expirou: Envia email "Trial Expirado"
3. Registra resultados (sucessos/erros)
```

### **Webhook Asaas (Quando pagamento é confirmado)**
```
1. Asaas envia webhook de pagamento confirmado
2. Sistema ativa assinatura
3. Sistema envia email "Pagamento Confirmado"
```

---

## 📊 Monitoramento

### **Logs**
Todos os envios de email são logados:
- `[EMAIL]` - Envio bem-sucedido
- `[EMAIL_ERROR]` - Erro no envio
- `[TRIAL_NOTIFICATION]` - Notificação de trial enviada
- `[CRON_TRIAL]` - Execução do cron job

### **Métricas**
- Total de trials ativos
- Trials expirando (2 dias)
- Trials expirados
- Erros no envio

---

## 🧪 Testar

### **1. Testar Envio Manual**
```bash
# No terminal
curl -X POST http://localhost:3000/api/notifications/trial
```

### **2. Testar Template de Email**
```typescript
import { getTrialExpiringEmailTemplate } from '@/lib/email'

const html = getTrialExpiringEmailTemplate({
  userName: 'João Silva',
  planName: 'Premium',
  daysRemaining: 2,
  trialEndDate: '25 de janeiro de 2025',
  upgradeUrl: 'http://localhost:3000/dashboard/upgrade',
})

console.log(html) // Ver HTML gerado
```

### **3. Testar em Desenvolvimento**
Sem `RESEND_API_KEY` configurada, o sistema simula o envio (apenas loga no console).

---

## ⚠️ Importante

1. **Configurar Resend**: Sem API key, emails não serão enviados (apenas simulados)
2. **Cron Secret**: Proteja o endpoint de cron com um secret forte
3. **Domínio Verificado**: Para melhor deliverability, verifique seu domínio no Resend
4. **Rate Limits**: Resend tem limites de envio (verificar plano)
5. **Testes**: Sempre teste em desenvolvimento antes de produção

---

## 📝 Próximos Passos (Opcional)

1. **Notificações por WhatsApp**: Integrar com WhatsApp Business API
2. **Notificações Push**: Adicionar notificações no navegador
3. **Personalização**: Permitir customizar templates por plano
4. **Analytics**: Rastrear abertura e cliques nos emails
5. **A/B Testing**: Testar diferentes versões de templates

---

## ✅ Status

- ✅ Serviço de email implementado
- ✅ Templates criados
- ✅ APIs de notificação criadas
- ✅ Cron job configurado
- ✅ Integração com webhook Asaas
- ⏳ Configurar Resend (pendente - precisa de API key)
- ⏳ Testar em produção (pendente)

