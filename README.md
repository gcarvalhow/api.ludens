# api.ludens

Backend da plataforma **Ludens** — venda de ingressos para um teatro
comunitário (busca de espetáculos, reserva, compra e confirmação). API em
**FastAPI**, com arquitetura de **monólito modular + DDD**, **PostgreSQL** e
**Docker**.

> Projeto acadêmico do Processo/Grupo 18 — disciplina de Manutenção e Melhoria
> de Software (Engenharia de Software, Centro Universitário Católica de Santa
> Catarina).

## Documentação

Produto, requisitos, arquitetura e padrões de engenharia ficam centralizados em
**[`gcarvalhow/docs.ludens`](https://github.com/gcarvalhow/docs.ludens)** — este
repositório só traz o código.

- [Arquitetura do backend](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/backend/overview.md)
- [Decisões de design (ADRs)](https://github.com/gcarvalhow/docs.ludens/tree/HEAD/backend/design)
- [Segurança e configuração](https://github.com/gcarvalhow/docs.ludens/tree/HEAD/backend/security)
- [Testes e CI](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/backend/testing.md)
- [Guia de estilo](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/backend/code-style.md)
- [Como subir o ambiente localmente](https://github.com/gcarvalhow/docs.ludens/blob/HEAD/team/development.md)

## Stack

Python 3.12 · FastAPI · SQLAlchemy · Alembic · PostgreSQL · Docker Compose ·
Ruff (lint) · pytest (testes do domínio).

> **Status:** arquitetura desenhada, implementação a iniciar.
