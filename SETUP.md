# Guia de Setup do MeuAssistente

## 1. Configuração do Ambiente

### 1.1 Pré-requisitos
- PostgreSQL 14+
- Redis 6+
- Node.js 18+
- N8N (para automações)

### 1.2 Configuração das Variáveis de Ambiente
1. Copie o arquivo `.env.example` para `.env`
2. Configure as variáveis de acordo com seu ambiente

### 1.3 Configuração do Banco de Dados
```bash
# Gere os clients do Prisma
npx prisma generate

# Execute as migrações
npx prisma migrate dev

# Popule o banco com dados iniciais
npx prisma db seed
```

## 2. Configuração das Integrações

### 2.1 Google OAuth
1. Acesse o Google Cloud Console
2. Crie um novo projeto
3. Habilite as APIs:
   - Google Calendar API
   - Google Tasks API
   - Google OAuth
4. Configure as credenciais OAuth
5. Adicione os URIs de redirecionamento:
   - http://localhost:3000/api/auth/callback/google
   - seu-dominio.com/api/auth/callback/google

### 2.2 Asaas
1. Crie uma conta no Asaas
2. Gere uma API Key
3. Configure o webhook para:
   - seu-dominio.com/api/webhooks/asaas

### 2.3 WhatsApp Business API
1. Configure uma conta Business no WhatsApp
2. Siga o processo de verificação
3. Configure o webhook para:
   - seu-dominio.com/api/webhooks/whatsapp

### 2.4 N8N
1. Instale o N8N:
   ```bash
   npm install n8n -g
   ```
2. Configure os workflows básicos:
   - Processamento de mensagens WhatsApp
   - Sincronização do Google Calendar
   - Sincronização de tarefas
   - Processamento de pagamentos

## 3. Inicialização

### 3.1 Desenvolvimento
```bash
# Instale as dependências
npm install

# Inicie o Redis
redis-server

# Inicie o N8N
n8n start

# Inicie o projeto
npm run dev
```

### 3.2 Produção
```bash
# Build do projeto
npm run build

# Inicie em produção
npm start
```

## 4. Verificações

### 4.1 Checklist de Funcionalidades
- [ ] Autenticação funcionando
- [ ] Integração com Google Calendar
- [ ] Integração com Google Tasks
- [ ] Sistema de pagamentos
- [ ] Processamento de WhatsApp
- [ ] Automações N8N

### 4.2 Testes
```bash
# Execute os testes
npm test

# Verifique a cobertura
npm run test:coverage
```
