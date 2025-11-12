# Configuração do MeuAssistente no EasyPanel

Este guia explica como fazer o deploy do MeuAssistente no EasyPanel.

## Pré-requisitos

1. Conta no EasyPanel
2. Banco de dados PostgreSQL (pode ser criado no EasyPanel ou externo)
3. Variáveis de ambiente configuradas

## Passo a Passo

### 1. Criar Novo Projeto no EasyPanel

1. Acesse o EasyPanel
2. Clique em "New App"
3. Selecione "Docker" como tipo de aplicação
4. Conecte seu repositório Git (GitHub, GitLab, etc.)

### 2. Configurar Build

- **Dockerfile Path**: `Dockerfile` (ou deixe em branco se estiver na raiz)
- **Build Context**: `.` (raiz do projeto)
- **Docker Build Args** (opcional, se necessário):
  ```
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=seu-secret-aqui
  ```

### 3. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no EasyPanel:

#### Obrigatórias:
```
DATABASE_URL=postgresql://usuario:senha@host:porta/database
NEXTAUTH_SECRET=seu-secret-super-seguro-aqui
NEXTAUTH_URL=https://seu-dominio.com
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

#### Gateway de Pagamento (Asaas):
```
ASAAS_API_KEY=sua-chave-api-asaas
ASAAS_API_URL=https://api.asaas.com/v3
```

#### Email (Resend):
```
RESEND_API_KEY=sua-chave-resend
```

#### Google OAuth (opcional):
```
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

#### Redis (opcional, para cache):
```
REDIS_URL=redis://host:porta
```

#### N8N (opcional):
```
N8N_API_URL=https://seu-n8n.com
N8N_API_KEY=sua-chave-n8n
```

### 4. Configurar Porta

- **Porta Interna**: `3000`
- **Porta Externa**: Configure conforme necessário (EasyPanel pode mapear automaticamente)

### 5. Health Check (Opcional)

Configure um health check endpoint:
- **Path**: `/api/health`
- **Interval**: 30s
- **Timeout**: 10s

### 6. Banco de Dados

#### Opção A: Criar PostgreSQL no EasyPanel
1. Crie um novo serviço PostgreSQL no EasyPanel
2. Copie a string de conexão para `DATABASE_URL`
3. Execute as migrations após o primeiro deploy:
   ```bash
   npx prisma migrate deploy
   ```

#### Opção B: Usar Banco Externo
1. Configure a `DATABASE_URL` com a string de conexão externa
2. Execute as migrations manualmente

### 7. Executar Migrations

Após o primeiro deploy, execute as migrations do Prisma:

**Opção 1: Via terminal do EasyPanel**
```bash
npx prisma migrate deploy
npx prisma generate
```

**Opção 2: Via script de inicialização**
Você pode criar um script que executa as migrations automaticamente no primeiro deploy.

### 8. Seed do Banco (Opcional)

Para popular o banco com dados iniciais:
```bash
npm run db:seed
```

## Comandos Úteis

### Ver logs
```bash
# No EasyPanel, use a interface de logs ou:
docker logs <container-id>
```

### Executar comandos no container
```bash
# Via EasyPanel terminal ou:
docker exec -it <container-id> sh
```

### Atualizar Prisma Client após mudanças no schema
```bash
npx prisma generate
```

## Troubleshooting

### Erro: "Prisma Client not generated"
- Execute `npx prisma generate` no container
- Ou adicione ao script de build

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está correta
- Verifique se o banco está acessível do container
- Verifique firewall/security groups

### Erro: "Next.js build failed"
- Verifique se todas as variáveis de ambiente necessárias estão configuradas
- Verifique os logs de build no EasyPanel

### Aplicação não inicia
- Verifique os logs: `docker logs <container-id>`
- Verifique se a porta 3000 está exposta corretamente
- Verifique se `NEXTAUTH_URL` está correto

## Otimizações

### Cache de Build
O Dockerfile usa multi-stage build para otimizar o cache. As dependências são instaladas em um stage separado, acelerando builds subsequentes.

### Tamanho da Imagem
A imagem final usa `node:20-alpine` e apenas copia os arquivos necessários para produção, mantendo o tamanho mínimo.

### Segurança
- Usa usuário não-root (`nextjs`)
- Remove arquivos desnecessários via `.dockerignore`
- Usa `NODE_ENV=production`

## Recursos Adicionais

- [Documentação do EasyPanel](https://easypanel.io/docs)
- [Documentação do Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Documentação do Prisma](https://www.prisma.io/docs)

