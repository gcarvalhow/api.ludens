# Navegação e gerenciamento da conta do comprador

Implementação da issue P0 de conta do comprador. Esta é a fatia do comprador;
o plano antigo em `frontend.md` também inclui listagem administrativa de
usuários, que não faz parte desta entrega.

## Navegação e perfil

* Visitante: Entrar e Criar conta.
* Comprador autenticado: identificação pelo nome, Minha conta, Minhas reservas
  e Sair. Administradores também recebem acesso ao painel existente.
* Navegação com quebra de linhas no celular, links e botões acessíveis por
  teclado e atalho para o conteúdo principal.
* `/minha-conta` e `/minhas-reservas` exigem autenticação. O login preserva
  caminho, query e fragmento originais em `returnTo`. Destinos externos,
  barras invertidas, caracteres de controle e retornos circulares são recusados.
* Trocar entre login e cadastro mantém o destino. O retorno usa `replace`.
* Reservas ainda não têm módulo implementado. A página informa essa
  indisponibilidade, sem simular uma listagem.
* Nome editável até 120 caracteres; CPF permanece imutável.
* Senha atual obrigatória e nova senha de pelo menos oito caracteres, limitada
  a 72 bytes em UTF-8 pelo bcrypt, com validação no frontend e na API. Sucesso
  encerra todas as sessões e retorna ao login com aviso.
* Novo e-mail informado duas vezes; somente `new_email` vai ao backend.
  O link segue ao endereço atual e vale por uma hora. Nova solicitação
  invalida o link anterior.
* Solicitar exclusão não encerra a conta. A política de preservação e a
  ciência do usuário são apresentadas antes de solicitar e antes de confirmar.
* Erros e resultados aparecem junto ao formulário com avisos acessíveis.

## Confirmações públicas

* `/confirmar-troca-de-email?token=...` chama
  `PATCH /api/identity/users/email/change?token=...` após clique explícito.
* `/confirmar-exclusao-de-conta?token=...` chama
  `DELETE /api/identity/users/deletion?token=...` após ciência da política
  e clique explícito.
* Abrir a página por GET não altera dados nem consome o token, evitando
  confirmações por pré-visualizadores de e-mail.
* Token ausente não dispara requisição. Token inválido, expirado ou usado
  recebe tratamento de 410 e orientação para solicitar outro em Minha conta.
  Falha de rede permite tentar novamente.
* Sucesso revoga sessões, remove o cookie de refresh no navegador da
  confirmação e limpa token e cache privados do frontend. A troca orienta
  novo login; a exclusão oferece retorno ao catálogo.
* As páginas usam `noindex`, `nofollow` e política de referência
  `no-referrer`.

## Preservação comercial na exclusão

A política mantém a desativação lógica prevista em `spec.md`:

* Preservar a linha, o identificador e os dados de cadastro do usuário;
  alterar `is_active` e rotacionar `security_stamp`.
* Revogar os refresh tokens e impedir autenticação da conta encerrada.
* Preservar vínculos comerciais. Excluir conta não cancela compra, não
  invalida ingresso nem solicita reembolso.
* Explicar que o histórico e o cancelamento/reembolso deixam de estar
  acessíveis pela conta; tratamento posterior ocorre com o teatro.
* Manter o bloqueio de encerramento do último administrador.

Pedidos e ingressos ainda não têm tabelas na base atual. O teste verifica
preservação física da identidade e revogação de acesso, sem afirmar validar
módulos comerciais ausentes. Quando `booking` e `payment` existirem, devem
integrar os bloqueios durante reserva aberta ou pagamento em andamento já
previstos em `spec.md`.

## Contrato e verificação

Ver o [contrato de usuário](integration.md) e o
[contrato de autenticação](../identity-auth/integration.md). A aplicação real
monta todos os routers sob `/api`.

Frontend:

```sh
npm ci
npm run lint
npm test -- --runInBand
npm run test:proxy
npm run build
npm run test:e2e
```

Os testes de navegador usam respostas controladas da API para verificar
interação, retorno após login, perfil, senha, e-mail, confirmação e teclado
em 375 px. Localmente usam Chrome instalado; no CI, Chromium instalado pelo
workflow. Não substituem homologação com API real.

Backend:

```sh
docker compose -f docker/docker-compose.Staging.yml up -d --wait
python -m pytest -q
```

`test_buyer_account.py` cobre tokens inválidos, expirados, usados e
substituídos, preservação da identidade, revogação de sessões e confirmação
HTTP com remoção do cookie.

## Garantias acrescentadas na revisão

* A renovação automática não pode repetir uma requisição da conta anterior
  com credenciais de um novo comprador. Respostas atrasadas de inicialização
  também não restauram uma sessão explicitamente encerrada.
* O retorno após login recusa caminhos que se tornam externos após normalizar
  segmentos como `..`. O link Entrar preserva query e fragmento da origem.
* Abrir outro token na mesma página reinicia o estado de confirmação, sem
  herdar erro ou sucesso do token anterior.
* Solicitações e confirmações do mesmo usuário são serializadas no banco,
  com bloqueio da conta antes do token. Uma solicitação concorrente não deixa
  dois links utilizáveis; o mesmo token só pode confirmar uma vez.
* Exclusões administrativas bloqueiam os administradores ativos em ordem
  estável antes da conta e do token, preservando pelo menos um administrador.
* As restrições de unicidade de e-mail e CPF em contas ativas, já existentes
  na migration `0001`, também estão no metadata usado pelos testes. Conflitos
  detectados pelo banco retornam erro de negócio, sem erro interno ao comprador.

`test_account_concurrency.py` executa transações concorrentes contra PostgreSQL
real, incluindo dois compradores tentando confirmar o mesmo endereço de e-mail.

## Resultado da validação local em 23/10/2026

* API: 85 testes aprovados, incluindo integração HTTP e banco PostgreSQL
  temporário isolado. Foi usado PostgreSQL 18 local; o CI mantém PostgreSQL 16.
* Frontend: 68 testes Jest e quatro testes de proxy aprovados.
* Navegador: quatro cenários Playwright aprovados em Chrome, incluindo celular
  e teclado, com respostas controladas da API.
* Build de produção e lint do frontend aprovados; permanecem três avisos
  preexistentes de imagens no catálogo e logo.
* Os seis documentos de contrato/implementação alterados passaram no
  markdownlint e na verificação de links locais.

Esses resultados não representam publicação na Vercel nem aceite funcional
do PO em ambiente compartilhado.
