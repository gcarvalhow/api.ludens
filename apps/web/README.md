# web.ludens

<p align="center">
  <img src=".github/assets/logo.png" alt="ludens" width="180">

  <h3 align="center">ludens</h3>

  <p align="center">
    Plataforma de Venda de Ingressos para Teatro Comunitário
  </p>
</p>

Frontend da plataforma **Ludens** — a aplicação web onde o comprador descobre
espetáculos, reserva assentos, paga por Pix e acompanha as compras, e o admin do
teatro gerencia espetáculos e sessões.

> Projeto acadêmico do Processo/Grupo 18 — disciplina de Manutenção e Melhoria de
> Software (Centro Universitário Católica de Santa Catarina).

## O que este frontend resolve

É a interface da plataforma que se torna a **fonte única de disponibilidade de
assentos**: a pessoa vê quantos ingressos ainda existem em tempo quase real,
reserva por 15 minutos (com contador visível), paga por Pix e recebe o ingresso —
sem risco de comprar um assento já vendido.

O produto completo (problema, requisitos RF/RN, contrato de cada feature) vive em
**[`gcarvalhow/docs.ludens`](https://github.com/gcarvalhow/docs.ludens)**.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js (App Router) · React 19 |
| Linguagem | TypeScript em modo estrito |
| Dados de servidor | TanStack Query v5 |
| Contrato / validação | Zod (fonte de verdade do tipo; `z.infer`) |
| Formulários | react-hook-form + `@hookform/resolvers/zod` |
| UI | Tailwind CSS · shadcn/ui (style `radix-nova`) · `next-themes` (claro/escuro) |
| Toasts | Sonner |
| Qualidade | ESLint (config Next) · Prettier — portão de pipeline · Jest (`npm run test`) |

## Arquitetura em resumo

Feature-based. As rotas ficam em `src/app/` (App Router); o domínio fica em
`src/features/{feature}/` (`catalog`, `booking`, `checkout`, `account`). O fluxo
de abstração é:

```
src/routes/endpoints.ts
  → schemas/ (Zod)
  → server/services/ (request + parse + transform de shape)
  → server/types/ (z.infer)
  → hooks/queries e hooks/mutations
  → hooks/forms
  → components/ (orchestration)
  → components/ui/ (apresentação pura)
```

Páginas e layouts são **Server Components** por padrão; componentes com hooks,
estado ou handlers levam `'use client'`. `src/app/` é entrypoint de rota, não o
lugar de regra de negócio de feature.

As regras completas de código estão na skill **`frontend-architecture`** do
plugin [`gcarvalhow/team.ludens`](https://github.com/gcarvalhow/team.ludens) — já
habilitado em `.claude/settings.json` (`core` + `frontend`).

### Estrutura do repositório

```text
src/
  app/
    layout.tsx        # <html lang="pt-BR">, Providers, metadata
    page.tsx          # vitrine (catalog)
    providers.tsx     # QueryClientProvider + Toaster ('use client')
    globals.css       # Tailwind
  features/           # catalog, booking, checkout, account (entram por spec)
  components/ui/      # shadcn/ui
  lib/               # fetcher e utilitários compartilhados
  routes/endpoints.ts
next.config.mjs
eslint.config.mjs
postcss.config.mjs
jest.config.ts
tsconfig.json
```

## Rodar localmente

Pré-requisitos: **Node 20+**.

```bash
git clone https://github.com/gcarvalhow/web.ludens
cd web.ludens

cp .env.example .env.local
npm install
npm run dev
```

- App em `http://localhost:3000`.
- `npm run build` — build de produção (inclui type check do TypeScript).
- `npm run lint` — ESLint.
- `npm run format` — Prettier.
- `npm run test` / `npm run test:watch` — Jest (`schemas/`, `services/`,
  `lib/`; ver `references/13-testing.md` da skill `frontend-architecture`
  pro padrão-alvo completo, Playwright incluso).

### Rodando junto com a API

Sem a API de pé, as telas de conta (`/login`, `/registro`, `/recuperar-senha`,
`/redefinir-senha`) carregam mas toda chamada falha. Suba o
[`api.ludens`](https://github.com/gcarvalhow/api.ludens) primeiro (ver o README
de lá — Postgres via `docker/docker-compose.Development.yml`, API via
`Dockerfile` próprio, porta `8000`; CORS já libera `http://localhost:3000` por
padrão). Com a API respondendo em `http://localhost:8000` e o `.env.local`
apontando pra lá, os dois processos conversam sem configuração extra.

### Variáveis de ambiente

Lidas de `.env.local`. Só variáveis `NEXT_PUBLIC_*` chegam ao browser.

| Variável | Padrão (dev) | Para que serve |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base da API (`api.ludens`). O `src/routes/endpoints.ts` monta as URLs a partir daqui. |

Cada feature acrescenta o que precisar (sem segredo no frontend — só o backend
guarda chave de gateway, SMTP, etc.).

## Fluxo de trabalho

Ative o plugin do time e abra uma **sessão nova**:

```bash
claude plugin marketplace add gcarvalhow/team.ludens
claude plugin install core@team-ludens --scope project
claude plugin install frontend@team-ludens --scope project
# /team-ludens:setup
```

Trunk é `master`; branches curtas em inglês (`feat/NN-slug`); **Conventional
Commits em português**; issues e backlog no
[Project `@ludens`](https://github.com/orgs/gcarvalhow/projects/2). Portões de
merge: `npm run lint` + `npm run test` + `npm run build` verdes + 1 aprovação.

## Documentação de referência

- [Escopo do produto](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/product/scope.md) · [Requisitos](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/requirements/functional.md)
- [Specs das features (N1)](https://github.com/gcarvalhow/docs.ludens/tree/HEAD/specs) — contrato backend→frontend em `integration.md`
- [Ambiente de desenvolvimento](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/team/development.md)

> **Status:** conta, catálogo, reservas e compra demonstrativa estão integrados
> com a API. Compras e códigos de ingresso ficam em `Minhas compras` e `Meus
> ingressos`; a simulação não cobra nem integra um gateway bancário.
