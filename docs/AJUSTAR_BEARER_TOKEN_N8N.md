# 🔧 Ajustar Bearer Token no N8N

## 📋 Situação Atual

No nó "Processar Mensagem - Sistema" do N8N, está configurado:

```
URL: https://meuassistente.inhaia.com/api/webhooks/whatsapp
Authorization Header: Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET || '' }}
```

Mas a variável `WHATSAPP_WEBHOOK_SECRET` não está configurada no N8N.

## ✅ Solução: Autenticação é Opcional

A autenticação do webhook é **opcional**. Se a variável `WHATSAPP_WEBHOOK_SECRET` não estiver configurada no sistema, o webhook funciona normalmente sem autenticação.

## 🎯 Opções

### Opção 1: Remover o Header Authorization (Recomendado se não usar autenticação)

1. **Abra o nó "Processar Mensagem - Sistema" no N8N**
2. **Vá na aba "Headers" ou "Authentication"**
3. **Remova o header `Authorization`** ou deixe vazio
4. **Salve o workflow**

### Opção 2: Configurar a Variável no N8N (Recomendado para produção)

1. **Acesse Settings no N8N**
   - Clique no ícone de engrenagem (⚙️)
   - Ou acesse: `https://seu-n8n.com/settings`

2. **Vá em "Environment Variables"**
   - Procure por "Environment Variables" ou "Variáveis de Ambiente"
   - Clique em "+ Add Variable"

3. **Adicione a variável:**
   ```
   Name: WHATSAPP_WEBHOOK_SECRET
   Value: seu-secret-aqui
   ```

4. **Configure também no sistema (EasyPanel/Docker):**
   ```
   WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui
   ```

5. **Use o mesmo valor em ambos os lugares**

### Opção 3: Usar um Secret Fixo (Mais Simples)

Se não quiser usar variáveis de ambiente, pode usar um secret fixo:

1. **No N8N, no nó "Processar Mensagem - Sistema":**
   - Header `Authorization`: `Bearer meu-secret-fixo-123`

2. **No sistema (EasyPanel/Docker), configure:**
   ```
   WHATSAPP_WEBHOOK_SECRET=meu-secret-fixo-123
   ```

## 🔍 Como Funciona

O código verifica se `WHATSAPP_WEBHOOK_SECRET` está configurado:

```typescript
const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET

// Se não houver secret configurado, não valida autenticação
if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
  return NextResponse.json(
    { status: 'error', message: 'Não autorizado' },
    { status: 401 }
  )
}
```

**Se `WHATSAPP_WEBHOOK_SECRET` não estiver configurado:**
- ✅ O webhook funciona normalmente
- ✅ Não valida autenticação
- ✅ Aceita requisições sem Bearer token

**Se `WHATSAPP_WEBHOOK_SECRET` estiver configurado:**
- ✅ Valida o Bearer token
- ✅ Rejeita requisições sem token ou com token inválido
- ✅ Mais seguro para produção

## 📝 Recomendações

### Para Desenvolvimento
- **Opção 1**: Remover o header Authorization
- Mais simples e rápido

### Para Produção
- **Opção 2 ou 3**: Configurar secret
- Mais seguro
- Protege o webhook de requisições não autorizadas

## 🧪 Testar

Após ajustar, teste enviando uma mensagem pelo WhatsApp:

1. **Envie uma mensagem de teste**
2. **Verifique os logs do N8N**
3. **Verifique se a resposta foi gerada corretamente**

## ⚠️ Importante

- Se remover o header Authorization, o webhook ficará **público** (qualquer um pode chamar)
- Para produção, **recomenda-se configurar o secret** para segurança
- Use um secret forte (mínimo 32 caracteres)

## 🔐 Gerar um Secret Forte

**Opção 1: Online**
- Acesse: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (256-bit)

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

