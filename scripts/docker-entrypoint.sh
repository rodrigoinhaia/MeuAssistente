#!/bin/sh
set -e

echo "🚀 Iniciando MeuAssistente..."

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não está configurada"
  exit 1
fi

# Executar migrations do Prisma (opcional - descomente se necessário)
# echo "📦 Executando migrations do Prisma..."
# npx prisma migrate deploy || echo "⚠️  Aviso: Erro ao executar migrations (pode ser normal se já foram executadas)"

# Gerar Prisma Client (caso necessário)
echo "🔧 Gerando Prisma Client..."
npx prisma generate || echo "⚠️  Aviso: Erro ao gerar Prisma Client"

# Iniciar aplicação
echo "✅ Iniciando servidor Next.js..."
exec node server.js

