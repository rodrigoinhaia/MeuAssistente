# ⚡ Guia Rápido: Remover Bearer Token do N8N

## 🎯 Problema

No nó "Processar Mensagem - Sistema" do N8N, está configurado:
```
Authorization: Bearer {{ $env.WHATSAPP_WEBHOOK_SECRET || '' }}
```

Mas você não tem essa variável configurada no N8N.

## ✅ Solução Rápida

**A autenticação é opcional!** Você pode simplesmente remover o header Authorization.

### Passo a Passo:

1. **Abra o workflow no N8N**
   - Workflow ID: `jydoDAnOVojEGX0D`

2. **Abra o nó "Processar Mensagem - Sistema"**

3. **Vá na aba "Headers" ou "Authentication"**

4. **Remova ou deixe vazio o header `Authorization`**

5. **Salve o workflow**

## 🔍 Como Funciona

O código do webhook verifica se `WHATSAPP_WEBHOOK_SECRET` está configurado:

- ✅ **Se NÃO estiver configurado**: Webhook funciona normalmente sem autenticação
- ✅ **Se estiver configurado**: Valida o Bearer token

Como você não tem a variável configurada, o webhook já funciona sem o Bearer token!

## 📝 Alternativa: Configurar a Variável

Se quiser usar autenticação (recomendado para produção):

1. **No N8N:**
   - Settings → Environment Variables
   - Adicione: `WHATSAPP_WEBHOOK_SECRET` = `seu-secret-aqui`

2. **No sistema (EasyPanel):**
   - Configure: `WHATSAPP_WEBHOOK_SECRET=seu-secret-aqui`

3. **Use o mesmo valor em ambos**

## 🧪 Testar

Após remover o header, teste enviando uma mensagem pelo WhatsApp. Deve funcionar normalmente!

## 📚 Documentação Completa

Veja `docs/AJUSTAR_BEARER_TOKEN_N8N.md` para mais detalhes.

