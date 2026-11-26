# Contrato de compra demonstrativa

A implementação local e educativa **não integra Pix, AbacatePay nem qualquer
serviço bancário**. O comprador escolhe um resultado de demonstração no checkout;
nenhuma cobrança ou dado financeiro é criado. Este contrato descreve o fluxo
entregue e prevalece sobre as decisões de gateway real descritas no rascunho
original desta spec.

Todas as rotas exigem autenticação de comprador. O usuário é obtido do token,
nunca do corpo da requisição. Respostas de pedidos usam `Cache-Control: no-store`.

| Método | Rota | Ação |
| --- | --- | --- |
| POST | `/api/booking/reservations/{id}/checkout` | Cria um pedido pendente ou retoma o único pedido da reserva |
| GET | `/api/booking/orders` | Lista pedidos do comprador, mais recentes primeiro |
| GET | `/api/booking/orders/{id}` | Consulta pedido próprio, ingressos e estado |
| POST | `/api/booking/orders/{id}/simulate` | Simula aprovação, recusa ou expiração |

Exemplo de simulação:

```json
{ "outcome": "approved" }
```

`outcome` aceita `approved`, `declined` ou `expired`. Aprovação confirma a
reserva e cria um código `DEMO-...` por ingresso na mesma transação. Recusa
cancela a reserva e libera a capacidade. Expiração marca reserva e pedido como
expirados e libera a capacidade. Repetir o mesmo resultado final retorna o
estado já persistido; a aprovação repetida não emite códigos adicionais. Uma
tentativa incompatível com o estado terminal retorna 409.

O pedido recebe quantidades, preços congelados, total, sessão e prazo a partir
da reserva; o cliente não informa valor. Só a própria pessoa pode consultar ou
alterar o pedido; IDs de terceiros retornam 404. Pedidos pendentes podem ser
retomados enquanto a reserva estiver aberta e dentro dos 15 minutos. O worker
de expiração também finaliza o pedido pendente quando vence a reserva.

Após aprovação, `OrderPaid` é gravado no outbox junto com pedido, reserva e
ingressos. O handler envia confirmação ao Mailpit no ambiente local. Falhas de
SMTP são retentadas pelo relay e não afetam os ingressos já persistidos. Os
códigos permanecem acessíveis por `GET /api/booking/orders` e
`GET /api/booking/orders/{id}`.

O frontend expõe `/checkout/{reservationId}`, `/minhas-compras`,
`/minhas-compras/{orderId}` e `/meus-ingressos`. Os códigos são apresentados em
cartões legíveis em celular e estão explicitamente identificados como
demonstração; não autorizam entrada em evento real.
