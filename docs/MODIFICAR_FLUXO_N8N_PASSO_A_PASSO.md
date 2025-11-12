# 🔧 Modificar Fluxo N8N - Passo a Passo Completo

## 📋 O que Vamos Fazer

Vamos adicionar validação de usuário no fluxo N8N para:
1. ✅ Verificar se o usuário está cadastrado
2. ✅ Tratar usuários não cadastrados adequadamente
3. ✅ Continuar o fluxo normal para usuários cadastrados

## 🎯 Fluxo Proposto

```
Edit Fields
  ↓
Processar Mensagem - Sistema (HTTP Request)
  ↓
IF (userRegistered === false?)
  ├─ SIM → Enviar mensagem "Não cadastrado" → FIM
  └─ NÃO → Continuar fluxo normal
      ↓
IF (requiresConfirmation === true?)
  ├─ SIM → Salvar contexto + Enviar confirmação
  └─ NÃO → Enviar resposta direta
```

## 📝 Passo a Passo

### Passo 1: Abrir o Workflow

1. Acesse o N8N
2. Abra o workflow `jydoDAnOVojEGX0D` (MeuAssistente)
3. Localize o nó **"Processar Mensagem - Sistema"** (já deve estar conectado após "Edit Fields")

### Passo 2: Adicionar Nó IF para Verificar Cadastro

**Após o nó "Processar Mensagem - Sistema":**

1. **Adicione um nó IF**
   - **Nome:** `Verificar Usuário Cadastrado`
   - **Tipo:** IF

2. **Configure a condição:**
   ```
   {{ $json.userRegistered }} === true
   ```
   
   Ou use a interface visual:
   - **Value 1:** `{{ $json.userRegistered }}`
   - **Operation:** `equals`
   - **Value 2:** `true`

3. **Conecte:**
   - **TRUE (saída superior):** Usuário cadastrado → Continuar fluxo
   - **FALSE (saída inferior):** Usuário não cadastrado → Enviar mensagem

### Passo 3: Tratar Usuário NÃO Cadastrado

**Na saída FALSE do IF:**

1. **Adicione um nó Set** (opcional, para formatação)
   - **Nome:** `Formatar Mensagem Não Cadastrado`
   - **Tipo:** Set
   - **Fields:**
     ```
     text = {{ $('Processar Mensagem - Sistema').item.json.response }}
     ```

2. **Conecte ao nó de envio de mensagem** (Evolution API ou similar)
   - Use: `{{ $json.text }}` ou `{{ $('Processar Mensagem - Sistema').item.json.response }}`

3. **Após enviar, adicione um nó Stop and Error** ou simplesmente **não conecte mais nada**
   - Isso garante que o fluxo pare aqui para usuários não cadastrados

### Passo 4: Tratar Usuário Cadastrado

**Na saída TRUE do IF:**

1. **Adicione outro nó IF** para verificar confirmação
   - **Nome:** `Verificar Confirmação`
   - **Tipo:** IF
   - **Condição:**
     ```
     {{ $json.requiresConfirmation }} === true
     ```

2. **Configure as saídas:**
   - **TRUE:** Precisa confirmação → Salvar contexto + Enviar confirmação
   - **FALSE:** Não precisa → Enviar resposta direta

### Passo 5: Fluxo de Confirmação (TRUE)

**Se `requiresConfirmation === true`:**

1. **Salvar contexto no Redis** (se já tiver esse nó)
   - Salvar: `phoneNumber`, `pendingAction`, `response`

2. **Enviar mensagem de confirmação**
   - Usar: `{{ $('Processar Mensagem - Sistema').item.json.response }}`

3. **Aguardar resposta** (Wait node ou webhook)
   - Quando receber resposta, chamar novamente "Processar Mensagem - Sistema"

### Passo 6: Resposta Direta (FALSE)

**Se `requiresConfirmation === false`:**

1. **Enviar resposta direta**
   - Usar: `{{ $('Processar Mensagem - Sistema').item.json.response }}`

## 🎨 Estrutura Visual do Fluxo

```
┌─────────────────┐
│  Edit Fields    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│ Processar Mensagem - Sistema│
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Verificar Usuário Cadastrado│ IF
└───────┬───────────────┬──────┘
        │               │
    TRUE│               │FALSE
        │               │
        ↓               ↓
┌──────────────┐  ┌──────────────────┐
│ Continuar    │  │ Enviar "Não     │
│ Fluxo        │  │ Cadastrado"      │
└──────┬───────┘  └────────┬─────────┘
       │                    │
       ↓                    │
┌───────────────────────────┘
│ Verificar Confirmação     │ IF
└───────┬───────────────┬────┘
        │               │
    TRUE│               │FALSE
        │               │
        ↓               ↓
┌──────────────┐  ┌──────────────┐
│ Salvar       │  │ Enviar       │
│ Contexto +   │  │ Resposta      │
│ Confirmação  │  │ Direta        │
└──────────────┘  └──────────────┘
```

## 📋 Configuração Detalhada dos Nós

### Nó 1: Verificar Usuário Cadastrado (IF)

**Configuração:**
```
Type: IF
Conditions:
  - Value 1: {{ $json.userRegistered }}
  - Operation: equals
  - Value 2: true
```

**Ou em JSON:**
```json
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "id": "condition1",
        "leftValue": "={{ $json.userRegistered }}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "true"
        }
      }
    ],
    "combinator": "and"
  }
}
```

### Nó 2: Enviar Mensagem Não Cadastrado

**Configuração (Evolution API):**
```
URL: https://api-whats.sdbr.app/message/sendText/{{ $('Webhook').item.json.body.data.key.remoteJid }}
Headers:
  apikey: {{ $('Webhook').item.json.body.apikey }}
Body:
  number: {{ $json.telefoneCliente }}
  text: {{ $('Processar Mensagem - Sistema').item.json.response }}
```

### Nó 3: Verificar Confirmação (IF)

**Configuração:**
```
Type: IF
Conditions:
  - Value 1: {{ $json.requiresConfirmation }}
  - Operation: equals
  - Value 2: true
```

### Nó 4: Salvar Contexto (Redis)

**Se você já tem um nó Redis:**
```
Key: session:{{ $json.telefoneCliente }}
Value: {
  "pendingAction": "{{ $json.action }}",
  "response": "{{ $json.response }}",
  "phoneNumber": "{{ $json.telefoneCliente }}"
}
TTL: 1800 (30 minutos)
```

### Nó 5: Enviar Resposta

**Configuração (Evolution API):**
```
URL: https://api-whats.sdbr.app/message/sendText/{{ $('Webhook').item.json.body.data.key.remoteJid }}
Headers:
  apikey: {{ $('Webhook').item.json.body.apikey }}
Body:
  number: {{ $json.telefoneCliente }}
  text: {{ $('Processar Mensagem - Sistema').item.json.response }}
```

## 🧪 Testar o Fluxo

### Teste 1: Usuário Cadastrado

1. **Enviar mensagem de número cadastrado:**
   ```
   Gastei R$ 50 no restaurante
   ```

2. **Verificar no N8N:**
   - "Processar Mensagem - Sistema" deve retornar `userRegistered: true`
   - "Verificar Usuário Cadastrado" deve ir para TRUE
   - Deve continuar o fluxo normal

### Teste 2: Usuário NÃO Cadastrado

1. **Enviar mensagem de número NÃO cadastrado:**
   ```
   Gastei R$ 50 no restaurante
   ```

2. **Verificar no N8N:**
   - "Processar Mensagem - Sistema" deve retornar `userRegistered: false`
   - "Verificar Usuário Cadastrado" deve ir para FALSE
   - Deve enviar mensagem "Não cadastrado"
   - Deve parar o fluxo

## 🔧 Alternativa Simplificada (Sem IF)

Se você não quiser adicionar o IF, pode simplesmente:

1. **Usar a resposta do sistema diretamente:**
   ```
   {{ $('Processar Mensagem - Sistema').item.json.response }}
   ```

2. **O sistema já retorna a mensagem correta:**
   - Se cadastrado → Mensagem processada
   - Se não cadastrado → Mensagem "Não cadastrado"

3. **Sempre enviar a resposta:**
   - O sistema já faz a validação e retorna a mensagem apropriada

## 📝 Checklist

- [ ] Adicionar nó IF "Verificar Usuário Cadastrado"
- [ ] Configurar condição: `userRegistered === true`
- [ ] Conectar FALSE → Enviar mensagem "Não cadastrado"
- [ ] Conectar TRUE → Continuar fluxo normal
- [ ] Adicionar nó IF "Verificar Confirmação" (opcional)
- [ ] Configurar envio de mensagem para usar `$json.response`
- [ ] Testar com usuário cadastrado
- [ ] Testar com usuário não cadastrado

## 🎯 Resumo

**Opção 1: Com IF (Recomendado)**
- Adiciona controle explícito
- Permite tratamento diferente para não cadastrados
- Mais claro no fluxo

**Opção 2: Sem IF (Mais Simples)**
- Apenas usa a resposta do sistema
- Sistema já faz tudo automaticamente
- Menos controle, mas funciona

**Recomendação:** Use a Opção 1 se quiser controle total, ou Opção 2 se quiser simplicidade.

