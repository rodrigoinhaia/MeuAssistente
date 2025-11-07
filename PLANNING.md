# Planejamento do Projeto - MeuAssistente

## Descrição do Projeto
Desenvolver um sistema multitenancy de assistente financeiro e de compromissos com agentes de IA, similar ao MeuAssessor.com. O sistema permitirá que clientes gerenciem suas finanças pessoais, compromissos e tarefas através de agentes de IA que processam mensagens via WhatsApp e integram com Google Agenda e Google Tasks.

## Análise de Arquitetura: Next.js vs Separação Backend/Frontend

### Opção 1: Next.js Full-Stack (Recomendado para este projeto)

#### ✅ Vantagens
- **Desenvolvimento mais rápido**: Uma única base de código
- **Deploy simplificado**: Um único projeto para gerenciar
- **API Routes nativas**: Roteamento de API integrado
- **SSR/SSG**: Melhor SEO e performance inicial
- **TypeScript nativo**: Tipagem compartilhada entre frontend e backend
- **Middleware integrado**: Autenticação e multitenancy mais simples
- **Menos complexidade**: Menos serviços para gerenciar
- **Custo reduzido**: Menos infraestrutura necessária

#### ⚠️ Considerações
- **Escalabilidade**: Pode ser limitante para muito alto volume
- **Separação de responsabilidades**: Menos clara que arquitetura separada
- **Equipe**: Desenvolvedores precisam conhecer frontend e backend

### Opção 2: Arquitetura Separada (Backend + Frontend)

#### ✅ Vantagens
- **Escalabilidade**: Backend e frontend podem escalar independentemente
- **Separação clara**: Equipes podem trabalhar independentemente
- **Tecnologias específicas**: Otimização para cada camada
- **Microserviços**: Facilita futuras divisões

#### ⚠️ Desvantagens
- **Complexidade**: Mais serviços para gerenciar
- **Deploy complexo**: Múltiplos projetos
- **CORS**: Configuração adicional necessária
- **Custo**: Mais infraestrutura necessária
- **Desenvolvimento mais lento**: Duas bases de código

## Recomendação: Next.js Full-Stack

Para o **MeuAssistente**, recomendo usar **Next.js 15 com App Router** pelos seguintes motivos:

1. **Projeto de médio porte**: Não justifica a complexidade da separação
2. **Time-to-market**: Desenvolvimento mais rápido
3. **Multitenancy**: Next.js tem excelente suporte para isso
4. **Agentes de IA**: API Routes são perfeitas para webhooks
5. **Custo-benefício**: Melhor para startups e MVPs

## Requisitos Funcionais Atualizados

### Sistema Multitenancy
- Cadastro e gerenciamento de clientes/empresas
- **Identificação por número de telefone**: Cada cliente identificado pelo número registrado
- **Único número WhatsApp**: Sistema centralizado com um número para todos os clientes
- Configurações personalizadas por cliente
- Isolamento completo de dados entre familys

### Painel de Gerenciamento (Admin)
- Dashboard administrativo para gestão de clientes
- Controle de assinaturas e cobranças
- Configurações globais do sistema
- Relatórios de uso e performance
- Gerenciamento de agentes de IA
- **Monitoramento do fluxo N8N**: Status e logs dos processamentos

### Painel do Cliente
- **Dashboard financeiro com:**
  - Contas a pagar e a receber
  - Gráficos de despesas por categorias
  - Relatórios por período (dias, semanas, meses)
  - Resumo financeiro em tempo real
- Gerenciamento de categorias de despesas
- **Cadastro de despesas e receitas** via interface
- **Agendamento de compromissos** integrado com Google Calendar
- **Gerenciamento de tarefas** integrado com Google Tasks
- Configurações de integração (Google Agenda/Tasks)

### Agentes de IA e Processamento
- **Fluxo N8N**: Processamento centralizado de mensagens
- **Identificação automática**: Cliente identificado pelo número de telefone
- Categorização automática de transações
- Registro de contas a pagar e receber
- Criação de compromissos e tarefas
- Respostas inteligentes sobre finanças

### Integrações
- **Google Calendar**: Criação e sincronização de eventos
- **Google Tasks**: Gerenciamento de tarefas
- **WhatsApp Business API**: Comunicação centralizada
- **Asaas**: Sistema de pagamentos (implementação posterior)
- **N8N**: Fluxo de processamento de mensagens

### Automações
- Lembretes diários de compromissos
- Resumos financeiros diários
- Alertas de contas a pagar
- Sincronização com Google Agenda/Tasks

## Requisitos Não Funcionais
- **Performance**: Tempo de resposta da API < 500ms
- **Escalabilidade**: Suporte a 10.000+ usuários simultâneos
- **Segurança**: Criptografia de ponta a ponta, conformidade LGPD
- **Disponibilidade**: 99.9% uptime
- **Acessibilidade**: WCAG 2.1 AA
- **Responsividade**: Funcionamento em mobile, tablet e desktop

## Estrutura do Projeto (Next.js 15 Full-Stack)

```
meuassistente/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── (admin)/           # Grupo de rotas admin
│   │   │   ├── dashboard/     # Dashboard administrativo
│   │   │   ├── clients/       # Gestão de clientes
│   │   │   ├── subscriptions/ # Controle de assinaturas
│   │   │   ├── n8n/          # Monitoramento N8N
│   │   │   └── settings/      # Configurações do sistema
│   │   ├── (client)/          # Grupo de rotas cliente
│   │   │   ├── dashboard/     # Dashboard financeiro
│   │   │   ├── transactions/  # Gestão de transações
│   │   │   ├── categories/    # Categorias
│   │   │   ├── commitments/   # Compromissos
│   │   │   ├── tasks/         # Tarefas
│   │   │   └── reports/       # Relatórios
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── webhooks/      # Webhooks (WhatsApp, N8N)
│   │   │   ├── google/        # Integrações Google
│   │   │   ├── asaas/         # Integração Asaas
│   │   │   └── ai/            # Agentes de IA
│   │   ├── globals.css        # Estilos globais
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Página inicial
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   ├── forms/            # Formulários
│   │   ├── charts/           # Gráficos e dashboards
│   │   ├── dashboard/        # Componentes específicos do dashboard
│   │   └── layout/           # Componentes de layout
│   ├── lib/                  # Utilitários e configurações
│   │   ├── auth.ts           # Configuração de autenticação
│   │   ├── db.ts             # Configuração do banco
│   │   ├── ai.ts             # Configuração de IA
│   │   ├── n8n.ts            # Configuração N8N
│   │   ├── asaas.ts          # Configuração Asaas
│   │   └── utils.ts          # Utilitários gerais
│   ├── hooks/                # Custom hooks
│   ├── services/             # Serviços de API
│   ├── types/                # Tipos TypeScript
│   └── middleware.ts         # Middleware Next.js
├── prisma/                   # Schema e migrações
│   ├── schema.prisma         # Schema do banco
│   └── migrations/           # Migrações
├── public/                   # Arquivos estáticos
├── n8n/                      # Fluxos N8N
│   ├── workflows/            # Workflows de processamento
│   ├── credentials/          # Credenciais
│   └── data/                 # Dados de configuração
├── docs/                     # Documentação
├── docker/                   # Configurações Docker
└── package.json
```

## Tecnologias e Ferramentas (Atualizado)

### Full-Stack (Next.js 15)
- **Framework**: Next.js 15 com App Router
- **Runtime**: Node.js com TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: PostgreSQL (principal) + Redis (cache)
- **ORM**: Prisma
- **Autenticação**: NextAuth.js ou Clerk
- **Validação**: Zod
- **Testes**: Jest + Testing Library
- **State Management**: Zustand ou React Context

### Processamento e IA
- **N8N**: Fluxo de processamento de mensagens
- **LLM**: OpenAI GPT-4 ou Claude
- **Processamento de Linguagem**: Natural.js
- **Agendamento**: node-cron
- **Filas**: Bull + Redis

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Deploy**: Vercel (recomendado) ou AWS/GCP
- **CI/CD**: GitHub Actions
- **Monitoramento**: Sentry + Vercel Analytics
- **Logs**: Winston + ELK Stack

### Integrações
- **WhatsApp**: WhatsApp Business API (número único)
- **Google**: Google Calendar API + Google Tasks API
- **Pagamentos**: Asaas (implementação posterior)
- **Email**: Resend ou SendGrid

## Etapas do Desenvolvimento (Atualizado)

### Fase 1: Fundação (2 semanas)
1. **Configuração do Ambiente**
   - Setup do projeto Next.js 15 com TypeScript
   - Configuração do banco de dados PostgreSQL
   - Setup do Prisma ORM
   - Configuração do Docker e ambiente de desenvolvimento

2. **Sistema de Autenticação e Multitenancy**
   - Implementação do sistema de autenticação (NextAuth.js)
   - Criação do middleware de multitenancy
   - Modelagem do banco de dados para familys
   - API Routes para registro e login
   - **Sistema de identificação por número de telefone**

### Fase 2: Core Backend (3 semanas)
3. **Modelagem e APIs Core**
   - Modelagem completa do banco de dados com Prisma
   - API Routes para gerenciamento de categorias
   - API Routes para transações financeiras
   - API Routes para compromissos e tarefas
   - **Sistema de contas a pagar e receber**

4. **Sistema de Assinaturas**
   - **Preparação para integração Asaas**
   - Gerenciamento de planos e assinaturas
   - Middleware de verificação de assinatura ativa

### Fase 3: N8N e Agentes de IA (3 semanas)
5. **Configuração N8N**
   - Setup do ambiente N8N
   - Configuração do fluxo de processamento
   - Integração com WhatsApp Business API
   - **Sistema de identificação de clientes por número**

6. **Processamento de Mensagens**
   - Processador de linguagem natural
   - Categorização automática de transações
   - Sistema de respostas inteligentes
   - **Integração com Google Calendar e Tasks**

### Fase 4: Integrações Externas (2 semanas)
7. **Google Integrations**
   - Integração com Google Calendar API
   - Integração com Google Tasks API
   - Sistema de sincronização bidirecional

8. **WhatsApp Integration**
   - Configuração do número único
   - Webhooks para recebimento de mensagens
   - Sistema de envio de lembretes

### Fase 5: Frontend Admin (2 semanas)
9. **Painel Administrativo**
   - Dashboard de gestão de clientes
   - Interface de controle de assinaturas
   - Configurações do sistema
   - **Monitoramento do fluxo N8N**
   - Relatórios administrativos

### Fase 6: Frontend Cliente (3 semanas)
10. **Painel do Cliente**
    - **Dashboard financeiro completo**
    - **Gráficos de despesas por categorias**
    - **Relatórios por período (dias, semanas, meses)**
    - **Cadastro de despesas e receitas**
    - **Agendamento de compromissos**
    - **Gerenciamento de tarefas**
    - Configurações de integração

### Fase 7: Automações e Otimizações (2 semanas)
11. **Sistema de Automações**
    - Lembretes diários via WhatsApp
    - Resumos financeiros automáticos
    - Sincronização com Google Agenda/Tasks
    - Sistema de notificações

12. **Testes e Deploy**
    - Testes unitários e de integração
    - Testes de carga
    - Deploy em Vercel
    - Monitoramento e logs

## Cronograma Estimado

| Fase | Duração | Descrição |
|------|---------|-----------|
| Fase 1 | 2 semanas | Fundação e configuração |
| Fase 2 | 3 semanas | Core Backend |
| Fase 3 | 3 semanas | N8N e Agentes de IA |
| Fase 4 | 2 semanas | Integrações Externas |
| Fase 5 | 2 semanas | Frontend Admin |
| Fase 6 | 3 semanas | Frontend Cliente |
| Fase 7 | 2 semanas | Automações e Deploy |

**Total Estimado: 17 semanas (aproximadamente 4.5 meses)**

## Modelo de Dados Principal (Atualizado)

### familys (Empresas/Clientes)
- id, name, phone_number, settings, subscription_plan, created_at

### Users (Usuários)
- id, family_id, name, email, phone, role, created_at

### Categories (Categorias)
- id, family_id, name, type (expense/income), color, icon

### Transactions (Transações)
- id, family_id, user_id, category_id, amount, description, type, date, status, due_date

### Commitments (Compromissos)
- id, family_id, user_id, title, description, date, time, google_event_id, status

### Tasks (Tarefas)
- id, family_id, user_id, title, description, due_date, google_task_id, status

### Subscriptions (Assinaturas)
- id, family_id, plan_id, status, start_date, end_date, asaas_subscription_id

### N8N_Workflows (Fluxos N8N)
- id, name, workflow_id, status, last_execution, created_at

## Considerações de Segurança

1. **Criptografia**: Todos os dados sensíveis criptografados
2. **Isolamento**: Separação completa entre familys
3. **Auditoria**: Logs de todas as ações críticas
4. **LGPD**: Conformidade com legislação brasileira
5. **Backup**: Backup automático diário dos dados
6. **N8N Security**: Configuração segura do ambiente N8N

## Métricas de Sucesso

1. **Performance**: API response time < 500ms
2. **Disponibilidade**: 99.9% uptime
3. **Precisão IA**: > 95% acurácia na categorização
4. **Satisfação**: > 4.5/5 rating dos usuários
5. **Retenção**: > 80% retenção mensal
6. **N8N Performance**: < 2s para processamento de mensagens

## Próximos Passos

1. Validação do planejamento com stakeholders
2. Definição de prioridades e MVP
3. Setup do ambiente de desenvolvimento com Next.js 15
4. Configuração inicial do N8N
5. Início da Fase 1 - Fundação 