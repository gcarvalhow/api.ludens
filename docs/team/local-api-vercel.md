# Frontend Vercel com API no computador

Requisitos: Docker Desktop iniciado com Linux containers e acesso ao projeto
Vercel `codepenguins-web-ludens`. Use somente dados fictícios: o túnel publica
a API na internet. Banco e Mailpit não são expostos pelo túnel.

## Iniciar

Na pasta `api.ludens`, execute:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Start-Demo.ps1
```

O roteiro cria `.env.demo` com JWT e senha do banco aleatórios na primeira
execução e preserva os valores nas seguintes. Nunca compartilhe esse arquivo.
O banco usa um volume próprio, separado dos ambientes dev e de testes.
Migrations executam antes da API e uma falha impede sua inicialização.

Se o endereço público ainda não aparecer, consulte:

```powershell
docker compose --env-file .env.demo -f docker/docker-compose.Demo.yml logs --tail 60 tunnel
```

Copie apenas a origem `https://...trycloudflare.com`, sem `/api`.

## Configurar Vercel

Em Project Settings → Environment Variables, para Production:

- Defina `API_PROXY_URL` com a origem HTTPS copiada.
- Remova `NEXT_PUBLIC_API_URL` (ou deixe vazio) para usar chamadas relativas.
- Publique o frontend contendo o rewrite de `next.config.mjs` e faça redeploy.

O navegador chama `/api` no domínio da Vercel; o servidor Next.js encaminha
ao túnel. Reiniciar o túnel pode gerar outro endereço: atualize a variável e
faça redeploy. Enquanto não fizer isso, a Vercel apontará ao túnel anterior.
API_PROXY_URL é incorporada aos rewrites durante o build.

Abra `https://codepenguins-web-ludens.vercel.app` e teste cadastro, login e
catálogo. A sessão usa cookie HttpOnly/Secure pelo proxy HTTPS; o banco local
continua sem exigir TLS. A API direta por HTTP serve para diagnóstico, mas
o cookie seguro desta configuração exige o acesso pelo frontend HTTPS.

## Diagnóstico e e-mail

- Saúde local: `http://localhost:8000/health`.
- Contrato interativo: `http://localhost:8000/docs`.
- E-mails de cadastro/recuperação: `http://localhost:8025` (Mailpit).
- Os links nos e-mails apontam ao domínio Vercel. Não há envio real de e-mail.
- Sem catálogo cadastrado, a lista poderá estar vazia; isso não é falha de rede.

Para criar administrador, use o script existente com os valores da equipe:

```powershell
$env:ADMIN_NAME = 'Admin Demo'
$env:ADMIN_CPF = 'CPF_VALIDO_DE_TESTE'
$env:ADMIN_EMAIL = 'admin@example.com'
# Defina ADMIN_PASSWORD localmente; não compartilhe nem registre seu valor.
docker compose --env-file .env.demo -f docker/docker-compose.Demo.yml run --rm -e ADMIN_NAME -e ADMIN_CPF -e ADMIN_EMAIL -e ADMIN_PASSWORD api python /app/src/scripts/seed_admin.py
```

Para inspecionar erros:

```powershell
docker compose --env-file .env.demo -f docker/docker-compose.Demo.yml ps -a
docker compose --env-file .env.demo -f docker/docker-compose.Demo.yml logs --tail 60 api migrations tunnel
```

Se localhost funciona mas Vercel não, confira se o túnel está ativo e se o
último build recebeu a origem correta. Login/refresh devem usar somente
URLs do domínio Vercel no painel Network do navegador.

## Parar e retomar

```powershell
docker compose --env-file .env.demo -f docker/docker-compose.Demo.yml --profile tunnel down
```

Não use `down -v`: isso remove os dados. Não apague `.env.demo` ao retomar,
pois trocar a senha não altera a senha do PostgreSQL já persistido.
PC, Docker e túnel precisam ficar ligados e com internet durante a demonstração.

O ambiente local tradicional continua disponível com `.env.local` e
`docker-compose.Development.yml`, sem REFRESH_COOKIE_SECURE e sem proxy.

## Verificação repetível

Na API, com as dependências de desenvolvimento instaladas, execute
`python tests/smoke_demo.py https://SEU-TUNEL`. O teste cria um usuário
sintético em example.com e verifica cadastro, login, cookies, refresh,
logout, catálogo e rota com barra final, sem imprimir credenciais.
Para conferir o proxy, execute o mesmo comando com a origem do frontend.
