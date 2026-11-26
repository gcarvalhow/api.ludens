# Contrato de reservas

Implementado em `api.ludens` e `web.ludens`. Todas as rotas abaixo exigem
comprador autenticado por Bearer token. O comprador vem da sessão autenticada;
o cliente não informa CPF ou usuário no payload.

| Método | Rota | Resultado |
| --- | --- | --- |
| POST | `/api/booking/reservations` | Cria uma reserva (201) ou recupera a mesma tentativa |
| GET | `/api/booking/reservations?page=1&size=12` | Página das reservas do comprador |
| GET | `/api/booking/reservations/{id}` | Detalhes da própria reserva |
| POST | `/api/booking/reservations/{id}/cancel` | Cancela uma reserva aberta; repetir é idempotente |
| GET | `/api/booking/reservations/{id}/rebooking-options` | Lista outras sessões futuras disponíveis do mesmo espetáculo, da mais próxima à mais distante |
| POST | `/api/booking/reservations/{id}/checkout` | Cria ou retoma o pedido demonstrativo ligado à reserva |

Criação:

```json
{
  "session_id": "UUID",
  "idempotency_key": "UUID gerado para esta seleção",
  "full_quantity": 2,
  "half_quantity": 1
}
```

Uma tentativa repetida com a mesma chave e seleção retorna o mesmo ID,
inclusive após expiração ou cancelamento. Reutilizar a chave com outra seleção
retorna 409. Uma nova reserva intencional usa outra chave e continua sujeita
ao limite por CPF. Não há criação automática ao retornar do login: a seleção
é restaurada e o comprador confirma o botão Reservar novamente.

A resposta contém `id`, `session_id`, `show_title`, `starts_at`, `venue`,
`full_quantity`, `half_quantity`, `full_price_cents`, `half_price_cents`,
`total_cents`, `status`, `created_at`, `expires_at` e `server_now`.
Valores monetários são inteiros em centavos; preços, título, data e local
são preservados na reserva. Datas usam ISO 8601 com fuso.

Estados: `open`, `confirmed`, `expired`, `cancelled`. Confirmação é um método
de domínio preparado para o módulo de pagamentos; não há endpoint público
permitindo que o comprador confirme sem pagar. Reservas confirmadas contam
como vendas e seguem o fluxo de reembolso para cancelamento.

Erros: 401 sem autenticação; 403 para criação por administrador; 404 para
reserva inexistente ou de outro comprador; 409 por falta de capacidade,
limite por CPF, sessão fechada ou chave incompatível; 422 por payload inválido.
A listagem é restrita ao dono, paginada e tem `Cache-Control: no-store`.

## Consistência e expiração

A criação trava a linha da sessão (`FOR UPDATE`) antes de recontar reservas
e vendas. O bloqueio é compartilhado com edição, exclusão e cancelamento
administrativos. Uma trava de leitura no espetáculo coordena publicação e
despublicação. Contagens incluem confirmadas e abertas com `expires_at > agora`.
A unicidade `(user_id, idempotency_key)` também é garantida no PostgreSQL.

`RESERVATION_TTL_MINUTES=15`, `MAX_TICKETS_PER_CPF=6` e
`RESERVATION_EXPIRY_INTERVAL_SECONDS=5` definem os padrões aprovados.
O worker consulta o banco ao iniciar e a cada intervalo, com `SKIP LOCKED`,
transicionando reservas vencidas e gravando eventos no outbox na mesma
transação. Consultas e cancelamentos também normalizam a expiração; a
disponibilidade ignora reservas vencidas mesmo antes da execução do worker.
Cancelar ou excluir uma sessão cancela suas reservas abertas na mesma transação.

## Interface e verificação

`/sessoes/{id}` contém seleção e subtotais. A seleção e a chave da tentativa
ficam no armazenamento local para sobreviver ao login e ao fechamento da página.
`/checkout/{id}` recupera a reserva persistida e inicia/retoma o pedido
demonstrativo. `/minhas-reservas` lista o
histórico, com detalhes, contador e acesso ao cancelamento. O contador usa a
hora retornada pelo servidor e reconsulta a API ao zerar.

Para reservas expiradas, canceladas ou cuja sessão já passou, “Reservar novamente”
consulta as opções da própria reserva. A resposta contém `server_now` e `sessions`
com `id`, `starts_at`, `venue` e `available_count`. A sessão original é excluída,
assim como sessões passadas, canceladas, inativas, esgotadas e de espetáculos
despublicados ou excluídos. Reservas vencidas não ocupam vagas nessa consulta.
O botão aponta inicialmente para a sessão elegível mais próxima; um seletor
permite escolher datas posteriores quando existirem. Sem opções, o botão fica
desabilitado com uma mensagem. A criação revalida disponibilidade e limite por
CPF, pois as vagas podem mudar depois da consulta. A rota exige autenticação e
retorna 404 para reservas de outro comprador.

Na página pública `/sessoes/{id}`, o botão “Escolher outra data”, abaixo do
local da sessão, permite trocar de data antes de reservar. A janela consulta
o catálogo público do espetáculo e apresenta outras sessões futuras à venda
com vagas, ordenadas por data. A sessão atual é excluída. Visitantes também
podem escolher outra data; o login continua sendo solicitado ao reservar.

Na pasta principal que reúne os repositórios:

```powershell
docker compose run --rm migrations
docker compose -f compose.test.yaml run --build --rm tests
docker compose exec -T web npm test -- --runInBand
```

O Compose de testes usa PostgreSQL próprio sem portas publicadas; nunca usa
o volume de desenvolvimento. A suíte inclui concorrência com conexões e
transações distintas, idempotência, limites, expiração, recuperação após
reinicialização, cancelamento e isolamento entre compradores.
