# MeuAssistente - Sistema Multitenancy com Agentes de IA

## 📋 Sobre o Projeto

O **MeuAssistente** é um sistema multitenancy completo para gestão financeira e de compromissos, integrado com agentes de IA para processamento de mensagens WhatsApp e automação de tarefas.

## 🚀 Status Atual

**✅ PAINEL ADMINISTRATIVO COMPLETO IMPLEMENTADO**

O sistema agora possui:
- **Autenticação completa** com NextAuth.js e Google OAuth
- **Painel do usuário** com gestão de transações, compromissos e tarefas
- **Painel administrativo** completo para OWNER/ADMIN global
- **APIs REST** para todas as funcionalidades core
- **Interface responsiva** e moderna com Tailwind CSS

## 🏗️ Arquitetura

- **Frontend**: Next.js 15 com App Router
- **Backend**: API Routes do Next.js
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: NextAuth.js
- **Styling**: Tailwind CSS
- **Processamento**: N8N (próxima etapa)
- **Pagamentos**: Asaas (próxima etapa)

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- Login com Google OAuth
- Registro de usuários
- Sistema de roles (OWNER, ADMIN, USER)
- Redirecionamento baseado em papel

### ✅ Painel do Usuário (USER)
- Dashboard com métricas
- Gestão de usuários do family
- Gestão de categorias
- Gestão de transações financeiras
- Gestão de compromissos
- Gestão de tarefas
- Página de integrações

### ✅ Painel Administrativo (OWNER/ADMIN)
- **Gestão de Planos**: Básico, Premium, Enterprise
- **Gestão de Assinaturas**: Filtros, status, ações
- **Gestão de Pagamentos**: Faturas, status de pagamento
- **Relatórios**: Métricas de faturamento, usuários, crescimento
- **Configurações**: Parâmetros do sistema, integrações
- **Monitoramento N8N**: Workflows, logs, métricas

### ✅ APIs REST
- Usuários (CRUD completo)
- familys (empresas)
- Categorias
- Transações
- Compromissos
- Tarefas
- Uso e assinaturas
- Logs de auditoria

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 20+ (recomendado) ou 18+
- PostgreSQL 16+ (ou compatível)
- Docker (opcional, para containerização)
- Git (para versionamento)

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd MeuAssistente
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Configure o banco de dados**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Execute o projeto**
```bash
npm run dev
```

### Docker (Opcional)

#### Desenvolvimento Local
```bash
docker-compose up -d
```

#### Build da Imagem
```bash
docker build -t meuassistente .
```

#### Executar Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="seu-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  meuassistente
```

### Deploy no EasyPanel

O projeto inclui um **Dockerfile otimizado** para deploy no EasyPanel. Veja o guia completo em [EASYPANEL_SETUP.md](./EASYPANEL_SETUP.md).

**Passos rápidos:**
1. Conecte seu repositório Git no EasyPanel
2. Configure as variáveis de ambiente (veja `EASYPANEL_SETUP.md`)
3. Defina a porta: `3000`
4. Faça o deploy
5. Execute as migrations: `npx prisma migrate deploy`

**Variáveis de ambiente obrigatórias:**
- `DATABASE_URL` - String de conexão PostgreSQL
- `NEXTAUTH_SECRET` - Secret para NextAuth
- `NEXTAUTH_URL` - URL da aplicação
- `NEXT_PUBLIC_APP_URL` - URL pública da aplicação

## 📁 Estrutura do Projeto

```
MeuAssistente/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/              # Autenticação
│   │   │   ├── users/             # Usuários
│   │   │   ├── tenants/           # Famílias (Tenants)
│   │   │   ├── categories/        # Categorias
│   │   │   ├── transactions/      # Transações
│   │   │   └── ...
│   │   ├── dashboard/             # Painel principal
│   │   │   ├── layout.tsx         # Layout com menu dinâmico
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── users/             # Gestão de usuários
│   │   │   ├── plans/             # Gestão de planos (Admin)
│   │   │   ├── subscriptions/     # Gestão de assinaturas (Admin)
│   │   │   ├── payments/          # Gestão de pagamentos (Admin)
│   │   │   ├── reports/           # Relatórios (Admin)
│   │   │   ├── settings/          # Configurações (Admin)
│   │   │   └── n8n/               # Monitoramento N8N (Admin)
│   │   ├── login/                 # Página de login
│   │   └── register/              # Página de registro
│   └── lib/                       # Utilitários
│       ├── db.ts                  # Configuração Prisma
│       └── ...
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   └── seed.ts                    # Seed do banco
├── public/                         # Arquivos estáticos
├── scripts/                        # Scripts auxiliares
│   └── docker-entrypoint.sh      # Script de inicialização Docker
├── Dockerfile                      # Dockerfile para produção
├── docker-compose.yml             # Docker Compose (desenvolvimento)
├── .dockerignore                  # Arquivos ignorados no Docker
├── EASYPANEL_SETUP.md             # Guia de deploy no EasyPanel
└── README.md                       # Este arquivo
```

## 🔐 Contas de Teste

Após executar o seed, você terá acesso a:

### Usuário OWNER (Admin Master)
- **Email**: admin@teste.com
- **Senha**: admin123
- **Acesso**: Painel administrativo completo

### Usuário ADMIN (Admin Global)
- **Email**: admin-global@teste.com
- **Senha**: admin123
- **Acesso**: Painel administrativo do family

### Usuário USER (Usuário Comum)
- **Email**: usuario@teste.com
- **Senha**: usuario123
- **Acesso**: Painel do usuário

## 🎨 Interface

### Menu Dinâmico
O sistema apresenta menus diferentes baseados no papel do usuário:

**Para USER:**
- Dashboard
- Usuários
- Categorias
- Transações
- Compromissos
- Tarefas
- Integrações

**Para OWNER/ADMIN:**
- Dashboard
- Clientes (familys)
- Planos
- Assinaturas
- Pagamentos
- Relatórios
- Configurações
- Monitoramento N8N

## 🐳 Docker e Deploy

### Dockerfile
O projeto inclui um Dockerfile multi-stage otimizado para produção:
- **Build otimizado**: Multi-stage build reduz tamanho da imagem
- **Segurança**: Executa com usuário não-root
- **Prisma**: Geração automática do Prisma Client
- **Standalone**: Next.js configurado para produção

### EasyPanel
Guia completo de deploy disponível em [EASYPANEL_SETUP.md](./EASYPANEL_SETUP.md).

**Características:**
- ✅ Dockerfile compatível com EasyPanel
- ✅ Configuração de variáveis de ambiente
- ✅ Health checks configurados
- ✅ Suporte a migrations automáticas
- ✅ Documentação completa

## 📊 Próximos Passos

### Prioridade Alta
1. **Integração de Dados Reais**: Conectar páginas com APIs do Prisma
2. **Sistema de Assinaturas**: Implementar lógica de planos e pagamentos
3. **Setup N8N**: Configurar ambiente de processamento

### Prioridade Média
1. **Integrações Google**: Calendar e Tasks APIs
2. **WhatsApp Business**: Configuração do número único
3. **Testes Automatizados**: Cobertura de funcionalidades críticas
4. **CI/CD**: Pipeline automatizado de deploy

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos canais oficiais do projeto.

---

**Desenvolvido com ❤️ para simplificar a gestão financeira e de compromissos** 