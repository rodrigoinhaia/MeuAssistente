# ⚡ Quick Start: Variáveis de Ambiente no N8N

## 🎯 Passo a Passo Rápido

### 1. Acesse o N8N

Abra seu N8N no navegador (ex: `https://n8n.sdbr.app`)

### 2. Vá em Settings

- Clique no **ícone de engrenagem** (⚙️) no canto superior direito
- Ou acesse diretamente: `https://seu-n8n.com/settings`

### 3. Encontre "Environment Variables"

- Procure por **"Environment Variables"** ou **"Variáveis de Ambiente"**
- Pode estar em uma aba ou seção separada

### 4. Adicione as Variáveis

Clique em **"+ Add Variable"** ou **"Adicionar"** e adicione:

**Variável 1:**
```
Name: NEXT_PUBLIC_APP_URL
Value: https://seu-dominio.com
```

**Variável 2:**
```
Name: WHATSAPP_WEBHOOK_SECRET
Value: seu-secret-aqui
```

### 5. Salve

Clique em **"Save"** ou **"Salvar"**

### 6. Pronto! ✅

As variáveis já estão disponíveis em todos os workflows.

## 🔍 Verificar se Funcionou

1. Abra o workflow `jydoDAnOVojEGX0D`
2. Abra o nó **"Processar Mensagem - Sistema"**
3. Veja o campo **URL:**
   - Deve mostrar: `{{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/whatsapp`
   - Quando executar, deve resolver para: `https://seu-dominio.com/api/webhooks/whatsapp`

## 📸 Onde Fica no N8N

```
N8N Interface
  ↓
[Menu Superior]
  ↓
Settings (⚙️) → Environment Variables
  ↓
+ Add Variable
  ↓
[Preencher Name e Value]
  ↓
Save
```

## 💡 Dica

Se não encontrar "Environment Variables", pode estar em:
- **Settings → General → Environment Variables**
- **Settings → Variables**
- **Workflow Settings → Environment Variables** (apenas para aquele workflow)

