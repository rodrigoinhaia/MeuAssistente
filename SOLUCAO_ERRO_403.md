# 🔧 Solução para Erro 403 (Forbidden)

## 🔍 Diagnóstico do Problema

O erro 403 pode ter várias causas. Siga este guia para identificar e resolver:

### 1. Verificar Sessão Atual

Acesse no navegador (após fazer login):
```
http://localhost:3000/api/debug-session
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "hasSession": true,
  "session": {
    "user": {
      "name": "Admin Master",
      "email": "admin@teste.com",
      "id": "...",
      "role": "OWNER",
      "familyId": "..."
    }
  }
}
```

**Se retornar `hasSession: false`:**
- A sessão não está sendo criada após o login
- Verifique os logs do servidor para erros de autenticação
- Limpe cookies e tente fazer login novamente

### 2. Verificar Logs do Servidor

Após fazer login, verifique o terminal onde o servidor está rodando. Você deve ver:

```
[AUTH_JWT] JWT callback - User login: { userId: '...', role: 'OWNER', familyId: '...' }
[AUTH_SESSION] Session callback: { hasToken: true, ... }
```

**Se não aparecer:**
- O login não está funcionando corretamente
- Verifique se `NEXTAUTH_SECRET` está configurado no `.env`

### 3. Verificar Middleware

O middleware agora tem logs. Verifique no terminal:

```
[MIDDLEWARE] Token não encontrado para rota: /api/...
[MIDDLEWARE] Token inválido (sem role ou familyId): ...
```

**Se aparecer:**
- O token não está sendo passado corretamente
- A sessão não está sendo criada

### 4. Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

**Para gerar um NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## ✅ Correções Aplicadas

1. **Middleware melhorado:**
   - Adicionado logs para debug
   - Verificação mais robusta de token
   - Rotas públicas explicitamente permitidas

2. **Logs de autenticação:**
   - Logs no callback JWT
   - Logs no callback Session
   - Facilita identificar onde está falhando

3. **Endpoint de debug:**
   - `/api/debug-session` para verificar sessão atual
   - `/api/test-auth` para testar autenticação

## 🚀 Passos para Resolver

### Passo 1: Limpar Cookies
1. Abra DevTools (F12)
2. Application → Cookies
3. Delete todos os cookies de `localhost:3000`
4. Feche e abra o navegador novamente

### Passo 2: Verificar NEXTAUTH_SECRET
```bash
# Verifique se existe no .env
cat .env | grep NEXTAUTH_SECRET

# Se não existir, gere um novo
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

### Passo 3: Reiniciar Servidor
```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### Passo 4: Fazer Login Novamente
1. Acesse: `http://localhost:3000/login`
2. Email: `admin@teste.com`
3. Senha: `admin123`
4. Verifique os logs no terminal

### Passo 5: Verificar Sessão
Após login, acesse:
```
http://localhost:3000/api/debug-session
```

## 🔍 Identificando a Rota com Erro

Para identificar qual rota está retornando 403:

1. Abra DevTools (F12)
2. Aba Network
3. Tente acessar a página que dá erro
4. Veja qual requisição retorna 403
5. Verifique a URL e o método (GET, POST, etc.)

## 📝 Exemplos de Rotas que Podem Dar 403

### Se for `/api/users`:
- Requer role `OWNER` ou `ADMIN`
- Se você for `USER`, dará 403

### Se for `/api/reports`:
- Requer role `OWNER`, `ADMIN` ou `SUPER_ADMIN`
- Se você for `USER`, dará 403

### Se for `/api/transactions`:
- `USER` só vê suas próprias transações
- Se tentar editar transação de outro usuário, dará 403

## 🆘 Se Nada Funcionar

1. **Verifique os logs completos:**
   - Terminal do servidor
   - Console do navegador (F12)
   - Network tab (F12 → Network)

2. **Teste a autenticação diretamente:**
   ```bash
   curl http://localhost:3000/api/test-auth?email=admin@teste.com
   ```

3. **Verifique se o banco tem os usuários:**
   ```bash
   npx ts-node --project tsconfig.seed.json scripts/test-connection.ts
   ```

4. **Recrie o banco (CUIDADO: apaga todos os dados):**
   ```bash
   npx prisma migrate reset
   npx prisma db seed
   ```

