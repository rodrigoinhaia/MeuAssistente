# 🔧 Troubleshooting - Envio de WhatsApp

## Problema: Mensagem não chega mesmo com status 201/PENDING

### Diagnóstico

Se a API retorna status `201 (Created)` ou `PENDING`, mas a mensagem não chega, isso geralmente significa:

1. **Número não está na lista de contatos da instância**
   - A Evolution API precisa que o número esteja na lista de contatos
   - Primeiro envie uma mensagem manualmente do WhatsApp Web para o número
   - Depois o sistema poderá enviar automaticamente

2. **Instância não está totalmente conectada**
   - Verifique se o status da instância é `open`
   - A instância precisa estar sincronizada com o WhatsApp

3. **WhatsApp precisa sincronizar**
   - Aguarde alguns minutos após conectar a instância
   - Verifique se há mensagens pendentes no WhatsApp Web

### Como Verificar

#### 1. Verificar Status da Instância

Execute o script de verificação:

```bash
npx tsx scripts/check-evolution-instance.ts
```

Ou via API:

```bash
curl -X GET https://api-whats.sdbr.app/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
```

#### 2. Verificar se o Número está Registrado

1. Acesse o WhatsApp Web da instância
2. Envie uma mensagem manualmente para o número `5551920014708`
3. Aguarde a mensagem ser entregue
4. Depois tente enviar via API novamente

#### 3. Verificar Logs

Procure nos logs do servidor por:
- `[SEND_WHATSAPP]` - Logs de envio
- `[OTP]` - Logs de OTP
- Status da mensagem: `PENDING`, `SENT`, `DELIVERED`, `FAILED`

### Soluções

#### Solução 1: Adicionar Número aos Contatos

1. Abra o WhatsApp Web da instância
2. Adicione o número `5551920014708` aos contatos
3. Envie uma mensagem de teste manualmente
4. Aguarde a entrega
5. Tente enviar via API novamente

#### Solução 2: Verificar Conexão da Instância

1. Acesse o painel da Evolution API
2. Verifique se a instância `INHAIA` está com status `open`
3. Se não estiver, reconecte o WhatsApp Web
4. Aguarde a sincronização completa

#### Solução 3: Testar com Número Diferente

Se o número `5551920014708` não funcionar, teste com outro número que você sabe que está na lista de contatos:

```bash
npx tsx scripts/test-whatsapp-number.ts
```

### Status da Mensagem

- **PENDING**: Mensagem aceita mas ainda não entregue (normal em alguns casos)
- **SENT**: Mensagem enviada com sucesso
- **DELIVERED**: Mensagem entregue ao destinatário
- **READ**: Mensagem lida pelo destinatário
- **FAILED**: Mensagem falhou ao ser enviada

### Próximos Passos

1. Execute o script de verificação da instância
2. Verifique se o número está na lista de contatos
3. Envie uma mensagem manual primeiro
4. Teste novamente via API
5. Verifique os logs do servidor para mais detalhes

