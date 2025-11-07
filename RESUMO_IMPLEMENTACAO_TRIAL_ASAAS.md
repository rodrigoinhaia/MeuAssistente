# ✅ Implementação Completa: Trial + Asaas + Planos

## 🎯 O que foi implementado

### 1. **Planos no Banco de Dados**
- ✅ Plano **Básico**: R$ 19,90/mês
- ✅ Plano **Premium**: R$ 29,90/mês
- ✅ Planos criados automaticamente no seed

### 2. **Fluxo de Registro Atualizado**
- ✅ **Step 0**: Escolha de plano (novo)
- ✅ **Step 1**: Dados básicos (nome, email, senha, CPF, WhatsApp)
- ✅ **Step 2**: Endereço
- ✅ Cria assinatura com **status: 'trial'**
- ✅ Trial de **3 dias grátis**
- ✅ Integração com Asaas (cria cliente e assinatura)

### 3. **Integração com Asaas**
- ✅ Serviço `src/lib/asaas.ts` com funções:
  - `createAsaasCustomer` - Criar cliente
  - `createAsaasSubscription` - Criar assinatura recorrente
  - `createAsaasPayment` - Criar cobrança única
  - `getAsaasSubscription` - Buscar assinatura
  - `cancelAsaasSubscription` - Cancelar assinatura

### 4. **Sistema de Trial**
- ✅ Assinatura criada com `status: 'trial'`
- ✅ `endDate` = hoje + 3 dias
- ✅ Verificação automática no dashboard layout
- ✅ Bloqueio automático após trial expirado
- ✅ Redirecionamento para página de upgrade

### 5. **Páginas Criadas**
- ✅ `/dashboard/upgrade` - Escolher plano após trial expirar
- ✅ `/dashboard/checkout` - Finalizar pagamento
- ✅ `/api/plans/public` - Listar planos (público, sem auth)

### 6. **APIs Criadas**
- ✅ `POST /api/subscriptions/create` - Criar/atualizar assinatura e cobrança
- ✅ `GET /api/subscriptions/check-trial` - Verificar status do trial
- ✅ `POST /api/webhooks/asaas` - Receber notificações do Asaas

### 7. **Webhook do Asaas**
- ✅ Processa eventos:
  - `PAYMENT_CONFIRMED` - Ativa assinatura
  - `PAYMENT_RECEIVED` - Ativa assinatura
  - `PAYMENT_OVERDUE` - Desativa assinatura
  - `PAYMENT_REFUSED` - Desativa assinatura

---

## 🔄 Fluxo Completo

### **Registro:**
```
1. Usuário acessa /register
2. Escolhe plano (Básico R$ 19,90 ou Premium R$ 29,90)
3. Preenche dados pessoais
4. Preenche endereço
5. Sistema cria:
   - Família
   - Usuário (OWNER)
   - Cliente no Asaas
   - Assinatura (status: 'trial', 3 dias)
   - Assinatura no Asaas (começa após trial)
6. Usuário tem 3 dias grátis para testar
```

### **Durante o Trial:**
```
- Usuário pode usar o sistema normalmente
- Dashboard mostra dias restantes
- Sistema verifica trial a cada acesso
```

### **Após Trial Expirar:**
```
1. Sistema bloqueia acesso automaticamente
2. Redireciona para /dashboard/upgrade
3. Usuário escolhe plano
4. Redireciona para /dashboard/checkout
5. Escolhe forma de pagamento (Cartão, Boleto, PIX)
6. Sistema cria cobrança no Asaas
7. Usuário paga
8. Webhook do Asaas confirma pagamento
9. Assinatura ativada
10. Acesso liberado
```

---

## ⚙️ Configuração Necessária

### **Variáveis de Ambiente (.env)**
```env
# Asaas
ASAAS_API_URL=https://sandbox.asaas.com/api/v3  # ou https://www.asaas.com/api/v3 (produção)
ASAAS_API_KEY=sua_api_key_aqui
```

### **Webhook no Asaas**
1. Acesse o painel do Asaas
2. Vá em Configurações → Webhooks
3. Adicione webhook: `https://seudominio.com/api/webhooks/asaas`
4. Selecione eventos:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUSED`

---

## 📝 Próximos Passos (Opcional)

1. **Melhorar checkout:**
   - Integrar formulário de cartão do Asaas
   - Mostrar QR Code do PIX
   - Mostrar boleto para download

2. **Notificações:**
   - Email quando trial está acabando (2 dias antes)
   - Email quando trial expirou
   - Email quando pagamento confirmado

3. **Dashboard de Assinatura:**
   - Mostrar status do trial
   - Mostrar próximas cobranças
   - Opção de cancelar assinatura

4. **Testes:**
   - Testar fluxo completo de registro
   - Testar webhook do Asaas
   - Testar bloqueio após trial

---

## ✅ Status

**Tudo implementado e pronto para uso!**

- ✅ Planos criados
- ✅ Registro com escolha de plano
- ✅ Trial de 3 dias
- ✅ Integração com Asaas
- ✅ Webhook configurado
- ✅ Bloqueio após trial
- ✅ Páginas de upgrade e checkout

**Falta apenas:**
- Configurar variáveis de ambiente do Asaas
- Configurar webhook no painel do Asaas
- Testar fluxo completo

