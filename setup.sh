#!/bin/bash

echo "🚀 Configurando MeuAssistente..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

echo "✅ Node.js e Docker encontrados"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar Prisma Client
echo "🗄️ Gerando Prisma Client..."
npx prisma generate

# Fazer push do schema para o banco
echo "🔄 Sincronizando banco de dados..."
npx prisma db push

echo "✅ Setup concluído!"
echo ""
echo "🎯 Para iniciar o desenvolvimento:"
echo "   npm run dev"
echo ""
echo "🐳 Para iniciar com Docker:"
echo "   docker-compose up -d"
echo ""
echo "📊 Para acessar o Prisma Studio:"
echo "   npm run db:studio"
echo ""
echo "🌐 URLs:"
echo "   - Aplicação: http://localhost:3000"
echo "   - N8N: http://localhost:5678 (admin/admin123)"
echo "   - Prisma Studio: http://localhost:5555" 