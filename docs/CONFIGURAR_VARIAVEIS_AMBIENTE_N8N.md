# 🔧 Como Configurar Variáveis de Ambiente no N8N

## 📋 Variáveis Necessárias

Você precisa configurar estas duas variáveis:

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
```

## 🎯 Onde Configurar

### Opção 1: Variáveis de Ambiente Globais (Recomendado)

**Para N8N Cloud ou Self-hosted:**

1. **Acesse o N8N**
   - Faça login no seu N8N

2. **Vá em Settings (Configurações)**
   - Clique no ícone de **engrenagem** (⚙️) no canto superior direito
   - Ou acesse: `https://seu-n8n.com/settings`

3. **Seção "Environment Variables"**
   - Procure por **"Environment Variables"** ou **"Variáveis de Ambiente"**
   - Clique em **"Add Variable"** ou **"Adicionar Variável"**

4. **Adicione as variáveis:**
   
   **Variável 1:**
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://seu-dominio.com` (ou `http://localhost:3000` para desenvolvimento)
   - **Type:** `String`
   
   **Variável 2:**
   - **Name:** `WHATSAPP_WEBHOOK_SECRET`
   - **Value:** `seu-secret-aqui` (use um secret forte, ex: `sk_live_abc123xyz...`)
   - **Type:** `String` (ou `Secret` se disponível)

5. **Salve**
   - Clique em **"Save"** ou **"Salvar"**

### Opção 2: Variáveis de Ambiente do Sistema (Self-hosted)

**Se você está rodando N8N em Docker ou servidor:**

1. **Docker Compose:**
   
   Edite o arquivo `docker-compose.yml`:
   ```yaml
   services:
     n8n:
       environment:
         - NEXT_PUBLIC_APP_URL=https://seu-dominio.com
         - WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
   ```

2. **Docker Run:**
   ```bash
   docker run -e NEXT_PUBLIC_APP_URL=https://seu-dominio.com \
              -e WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui \
              n8nio/n8n
   ```

3. **Arquivo .env:**
   
   Crie um arquivo `.env` na raiz do N8N:
   ```env
   NEXT_PUBLIC_APP_URL=https://seu-dominio.com
   WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
   ```

4. **Reinicie o N8N:**
   ```bash
   docker-compose restart
   # ou
   docker restart n8n
   ```

### Opção 3: Variáveis por Workflow (N8N Cloud/Enterprise)

**Se você tem N8N Cloud ou Enterprise:**

1. **Abra o workflow**
   - Abra o workflow `jydoDAnOVojEGX0D` (MeuAssistente)

2. **Vá em Settings do Workflow**
   - Clique no ícone de **engrenagem** no workflow
   - Procure por **"Environment Variables"** ou **"Workflow Variables"**

3. **Adicione as variáveis**
   - Adicione as mesmas variáveis acima
   - Essas variáveis ficam disponíveis apenas neste workflow

## 🔍 Como Verificar se Está Funcionando

### Teste 1: Verificar no N8N

1. **Abra o nó "Processar Mensagem - Sistema"**
2. **Veja o campo URL:**
   - Deve mostrar: `{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp`
   - Se aparecer o valor real (ex: `https://seu-dominio.com/api/webhooks/whatsapp`), está funcionando

3. **Veja o header Authorization:**
   - Deve mostrar: `Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET }}`
   - Se aparecer o valor real (ex: `Bearer sk_live_abc123...`), está funcionando

### Teste 2: Executar o Workflow

1. **Execute o workflow manualmente**
2. **Veja os logs do nó "Processar Mensagem - Sistema"**
3. **Verifique se a URL está correta**
4. **Verifique se não há erro 401 (não autorizado)**

## 📝 Valores Recomendados

### Para Desenvolvimento (Local)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WHATSAPP_WEBHOOK_SECRET=dev-secret-123
```

### Para Produção

```env
NEXT_PUBLIC_APP_URL=https://meuassistente.com.br
WHATSAPP_WEBHOOK_SECRET=sk_live_abc123xyz789_secret_forte_aqui
```

**⚠️ IMPORTANTE:**
- Use um secret forte em produção (mínimo 32 caracteres)
- Não compartilhe o secret publicamente
- Use diferentes secrets para dev e produção

## 🎨 Interface Visual do N8N

### N8N Cloud

```
Menu Superior
  ↓
Settings (⚙️)
  ↓
Environment Variables
  ↓
+ Add Variable
  ↓
Name: NEXT_PUBLIC_APP_URL
Value: https://seu-dominio.com
  ↓
Save
```

### N8N Self-hosted

```
Menu Lateral
  ↓
Settings
  ↓
Environment Variables
  ↓
+ Add Variable
  ↓
[Preencher campos]
  ↓
Save
```

## 🔐 Gerar um Secret Forte

**Opção 1: Online**
- Acesse: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (256-bit)
- Copie e cole no `WHATSAPP_WEBHOOK_SECRET`

**Opção 2: Terminal**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Opção 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ✅ Checklist

- [ ] Acessei Settings no N8N
- [ ] Encontrei "Environment Variables"
- [ ] Adicionei `NEXT_PUBLIC_APP_URL` com o valor correto
- [ ] Adicionei `WHATSAPP_WEBHOOK_SECRET` com um secret forte
- [ ] Salvei as configurações
- [ ] Reiniciei o N8N (se necessário)
- [ ] Testei o workflow
- [ ] Verifiquei que a URL está sendo resolvida corretamente
- [ ] Verifiquei que não há erro 401

## 🆘 Problemas Comuns

### Erro: "Variable not found"

**Solução:**
- Verifique se o nome da variável está exatamente igual: `NEXT_PUBLIC_APP_URL`
- Verifique se salvou as configurações
- Reinicie o N8N

### Erro: "401 Unauthorized"

**Solução:**
- Verifique se `WHATSAPP_WEBHOOK_SECRET` está configurado
- Verifique se o valor está correto (sem espaços extras)
- Verifique se o secret no sistema também está configurado

### Variável não aparece no nó

**Solução:**
- Use `{{ $env.NOME_DA_VARIAVEL }}` no nó
- Verifique se a variável está salva
- Tente recarregar a página do N8N

## 📚 Referências

- **Documentação N8N:** https://docs.n8n.io/hosting/environment-variables/
- **N8N Cloud:** https://app.n8n.cloud/settings/environment-variables
- **Self-hosted:** Configuração via Docker ou arquivo `.env`

