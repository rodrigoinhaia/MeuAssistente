# 🧪 Guia de Teste de Envio WhatsApp

Este documento explica como testar e diagnosticar problemas com o envio de mensagens via WhatsApp.

## 📋 Pré-requisitos

1. **Variáveis de Ambiente Configuradas:**
   ```env
   EVOLUTION_API_URL=https://sua-api-evolution.com
   EVOLUTION_API_KEY=sua-chave-api
   EVOLUTION_INSTANCE_NAME=nome-da-instancia
   ```

2. **Instância do Evolution API:**
   - Deve estar criada e conectada
   - Deve estar com status "open" (conectada)

## 🧪 Métodos de Teste

### 1. Teste via API (Recomendado)

**GET** - Verificar configuração:
```bash
curl https://seu-dominio.com/api/test/whatsapp
```

**POST** - Testar envio:
```bash
curl -X POST https://seu-dominio.com/api/test/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5551920014708",
    "message": "Teste de envio"
  }'
```

### 2. Teste via Script Local

```bash
npx tsx scripts/test-whatsapp-direct.ts
```

### 3. Teste via Navegador

Abra o console do navegador e execute:
```javascript
fetch('/api/test/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '5551920014708',
    message: 'Teste de envio'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## 🔍 Verificação de Logs

### Logs do Servidor

Procure por estas tags nos logs:
- `[SEND_WHATSAPP]` - Logs de envio
- `[OTP]` - Logs de geração de OTP
- `[RESEND_OTP]` - Logs de reenvio
- `[RESEND_OTP_PUBLIC]` - Logs de reenvio público
- `[TEST_WHATSAPP]` - Logs de teste

### Exemplo de Logs Esperados

**Sucesso:**
```
[SEND_WHATSAPP] Enviando requisição: { url: '...', phone: '5551920014708', ... }
[SEND_WHATSAPP] Resposta recebida: { status: 200, ok: true, ... }
[SEND_WHATSAPP] ✅ Mensagem enviada via Evolution API: { phone: '...', response: {...} }
```

**Erro:**
```
[SEND_WHATSAPP] ❌ Erro Evolution API: { status: 400, error: {...} }
```

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"

**Solução:**
1. Verifique se as variáveis estão configuradas no EasyPanel
2. Reinicie o serviço após adicionar variáveis
3. Verifique se os nomes das variáveis estão corretos

### Erro: "Evolution API retornou erro 400/401/404"

**Possíveis causas:**
1. **API Key inválida** - Verifique se a chave está correta
2. **Instância não existe** - Verifique o nome da instância
3. **Número não registrado** - O número deve estar na instância
4. **Instância desconectada** - Verifique o status da conexão

### Erro: "Número de WhatsApp inválido"

**Solução:**
- O número deve ter pelo menos 12 dígitos (com código do país)
- Formato esperado: `55` + DDD + número (ex: `5511999999999`)
- O sistema adiciona `55` automaticamente se necessário

### Mensagem não chega no WhatsApp

**Verifique:**
1. Instância está conectada? (status "open")
2. Número está registrado na instância?
3. Número está no formato correto?
4. Verifique os logs do Evolution API

## 📞 Número de Teste

Para testar, use: `5551920014708`

Este número já inclui o código do país (55) e deve funcionar se a instância estiver configurada corretamente.

## 🔧 Verificação Rápida

1. **Configuração:**
   ```bash
   curl https://seu-dominio.com/api/test/whatsapp
   ```

2. **Teste de Envio:**
   ```bash
   curl -X POST https://seu-dominio.com/api/test/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "5551920014708"}'
   ```

3. **Verificar Logs:**
   - Acesse os logs do servidor
   - Procure por `[SEND_WHATSAPP]` ou `[TEST_WHATSAPP]`
   - Verifique se há erros detalhados

