# API local com frontend na Vercel

## Objetivo

Manter o frontend publicado na Vercel e executar a API no computador do
usuário somente durante desenvolvimento e demonstrações. Não depender do
Azure ou das políticas de acesso da faculdade.

## Desenho

O Docker Compose da API terá PostgreSQL com volume persistente, Mailpit,
migrations Alembic em serviço de execução única e a API. A API só inicia
depois do banco saudável e da conclusão das migrations. Um perfil opcional
inicia cloudflared e encaminha HTTPS público para a API na rede Docker.
PostgreSQL não terá porta publicada; a interface Mailpit ficará apenas no
loopback do computador. A API local também ficará no loopback quando publicada.

O navegador chama `/api` no próprio domínio do frontend. Um rewrite do
Next.js encaminha `/api/:path*` para `API_PROXY_URL/api/:path*`, preservando
os prefixos existentes. `API_PROXY_URL` será uma variável exclusiva do
servidor, configurada no projeto Vercel. O frontend usará base relativa nesse
modo e manterá compatibilidade com `NEXT_PUBLIC_API_URL` no modo direto.

O caminho e os cookies de autenticação serão verificados pelo proxy. O
refresh cookie continuará HttpOnly e deverá usar Secure no acesso pela
Vercel. A configuração de cookie seguro será independente do ambiente do
banco: o PostgreSQL local não oferece o TLS exigido pelo modo production
atual. O modo de desenvolvimento seguirá funcionando sem HTTPS local.

## Inicialização e configuração

Um arquivo de exemplo documentará JWT aleatório, origem e URL pública do
frontend. Segredos ficarão em arquivo local ignorado pelo Git. Um roteiro
PowerShell guiará a inicialização sem imprimir os segredos.

O Quick Tunnel gera um endereço temporário. Depois de iniciar, o usuário
configura esse endereço como API_PROXY_URL na Vercel e republica o frontend.
Reiniciar o túnel pode mudar o endereço e exigir nova publicação. Um túnel
com domínio permanente fica fora desta primeira implementação.

As mensagens de teste ficam no Mailpit; não haverá envio real de e-mail.
O banco persiste mesmo ao parar os containers. A documentação não instruirá
remoção de volumes no fluxo normal de parada.

## Limites e falhas

O site só consegue usar dados quando computador, Docker e túnel estão
ligados e conectados à internet. O túnel publica a API na internet; apenas
a API deve ser encaminhada, nunca PostgreSQL ou Mailpit. Não serão usados
dados pessoais reais nas demonstrações.

Sem API_PROXY_URL, o comportamento existente do frontend será preservado.
Falhas do túnel deverão resultar no erro de conectividade já tratado pela
interface. Não haverá dependência de credenciais Azure.

## Verificação

Validar Docker Compose, build da API, migrations em banco novo e reinício
com dados persistentes. Verificar health check e catálogo através do túnel.
Testar login, refresh, logout e atributos de cookies pelo domínio Vercel,
além do fluxo local existente. Executar testes relevantes de autenticação,
lint e build do frontend. A publicação será feita somente com o endereço
real do túnel disponível e o acesso Vercel configurado.
