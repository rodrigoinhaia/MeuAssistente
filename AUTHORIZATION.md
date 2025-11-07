# Padrão de Autorização Multi-family

Este projeto utiliza um padrão centralizado de autorização para garantir o isolamento de dados entre familys (clientes) e o controle de acesso por papel (role) dos usuários.

## Objetivos
- Garantir que cada family só acesse seus próprios dados.
- Permitir que administradores globais (ADMIN) acessem e gerenciem todos os familys.
- Facilitar a manutenção e evolução do controle de acesso.

## Utilitário Central: `requireAuth`
O utilitário `requireAuth` (em `src/lib/authorization.ts`) centraliza a autenticação e autorização nas rotas de API.

### Exemplo de Uso
```typescript
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  // Use familyId para filtrar dados
}
```

- O segundo parâmetro é um array de roles permitidos para a rota. Se vazio, qualquer usuário autenticado pode acessar.
- O objeto retornado contém a sessão, o papel do usuário e o familyId.

## Boas Práticas
- **Sempre** utilize o `familyId` do usuário autenticado para filtrar dados nas queries do banco.
- **Nunca** confie em dados de familyId vindos do client ou do request body.
- **Restrinja** o acesso a rotas sensíveis usando o parâmetro de roles do `requireAuth`.
- **Admin (ADMIN)** pode acessar dados de todos os familys. **Owner/User** só acessam dados do seu family.
- **Documente** novas rotas e handlers que envolvam autorização.

## Exemplo de Handler Seguro
```typescript
export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, ['OWNER'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  // Criação de recurso atrelado ao familyId do usuário autenticado
}
```

## Checklist para Novas Rotas
- [x] Usar `requireAuth` no início do handler.
- [x] Filtrar/relacionar dados pelo `familyId` do usuário autenticado.
- [x] Definir roles permitidos conforme a regra de negócio.
- [x] Testar cenários de acesso para ADMIN, OWNER e USER.

---

**Dúvidas ou sugestões? Consulte este arquivo ou entre em contato com o time de desenvolvimento.** 