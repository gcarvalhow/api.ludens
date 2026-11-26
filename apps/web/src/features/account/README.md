# Account

Feature responsável pelos fluxos de autenticação e conta do usuário.

## Responsabilidades

- Login
- Registro
- Recuperação de senha
- Redefinição de senha
- Sessão autenticada
- Refresh de access token
- Logout
- Consulta do usuário autenticado
- Proteção de conteúdo autenticado

## Estrutura

- `components/`: orchestration (`*FormContainer.tsx` — liga hook + mutation +
  navegação) e `RequireAuth`
- `components/forms/`: formulário visual puro (`*Form.tsx` — recebe
  `form`/`onSubmit`/`isPending` por prop, shadcn/ui `Form`/`FormField`/...)
- `components/ui/`: `AuthShell` (Server Component — título/tagline "Ludens" +
  `Card`, fonte única da composição visual comum às 4 rotas)
- `contexts/`: contexto de autenticação
- `hooks/forms/`: formulários com React Hook Form
- `hooks/mutations/`: mutations com TanStack Query
- `hooks/queries/`: queries da conta
- `schemas/`: validação com Zod
- `server/types/`: tipos derivados dos schemas
- `services/`: integração com endpoints de autenticação

## Visual

shadcn/ui (style `radix-nova`) + Tailwind, paleta **"Teatro Clássico"** (fundo
branco, vermelho `#C81E1E` de destaque) — tokens em `src/app/globals.css`.
Claro é o tema default; `next-themes` + `<ThemeToggle />` (chrome global, fora
da feature) trocam pra escuro.

## Rotas

- `/login`
- `/registro`
- `/recuperar-senha`
- `/redefinir-senha`
- `/minha-conta` (protegida): perfil, senha, troca de e-mail e exclusão
- `/minhas-reservas` (protegida): informa que reservas ainda não estão disponíveis
- `/confirmar-troca-de-email?token=...` (pública, confirmação explícita)
- `/confirmar-exclusao-de-conta?token=...` (pública, confirmação explícita)

## Testes

`schemas/auth.schema.test.ts`, `services/auth.service.test.ts` e
`src/lib/fetcher.test.ts` (Jest — `npm run test`). Cobrem parse/rejeição de
payload, URL/método/shape de cada chamada e o fluxo de refresh em 401.
Os testes de componentes cobrem perfil, senha, solicitação e confirmação,
erros de link e preservação do destino. `npm run build` seguido de
`npm run test:e2e` executa os testes Playwright com respostas controladas
da API, incluindo celular e teclado. Localmente requer Chrome instalado;
o CI instala Chromium.

## Observação

A integração usa `NEXT_PUBLIC_API_URL` no modo direto ou base relativa no
proxy configurado por `API_PROXY_URL` (ver `.env.example` na raiz).

Logout e alteração de senha encerram todas as sessões. A exclusão mantém
a identidade e os vínculos comerciais; encerra o acesso, sem cancelar
compras nem solicitar reembolso. A política é exibida antes da solicitação
e da confirmação. Detalhes e contratos estão na
[documentação da conta do comprador](https://github.com/CodePenguinsCorp/docs.ludens/blob/feat/buyer-account-management/specs/identity-user-management/buyer-account.md).
