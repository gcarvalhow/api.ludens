# Equipe e Papéis (Matriz RACI)

Papéis conforme a Matriz RACI do Processo 18, atualizada para a N3.

## Integrantes e papéis

Papéis da N3 (entrega de 27/11/2026):

* DevOps: Igor Thiago Seberino ([@igorSeberino](https://github.com/igorSeberino))
* Engenheiro de Requisitos: Gabriel Carvalho ([@gabrielcarvallho](https://github.com/gabrielcarvallho))
* Desenvolvedor Full-stack: Adrian Cesar Gonçalves ([@adrian-cesar](https://github.com/adrian-cesar))
* Quality Assurance (QA): Renato Colin Neto ([@RenatoColin](https://github.com/RenatoColin))
* Product Owner (PO): Diego Nessler ([@Diegonessler](https://github.com/Diegonessler))

A matriz RACI abaixo (elaboração original de 31/07/2026) foi atualizada para
estes papéis.

## Matriz RACI

Legenda: R é Responsável (executa), A é Autoridade / Aprovador, C é
Consultado, I é Informado. Só entram na lista abaixo os papéis efetivamente
envolvidos em cada atividade.

* Definir o plano inicial de testes e os critérios de qualidade: Renato (QA)
  é R; Diego (PO) é A; Gabriel (Eng. Requisitos) é C.
* Configurar o projeto Next.js (App Router) e prototipar as telas
  principais: Adrian (Full-stack) é R; Renato (QA) é C; Diego (PO) é A.
* Organizar e priorizar o backlog do produto: Diego (PO) é R e A; Gabriel
  (Eng. Requisitos) é C.
* Configurar o ambiente Docker e a pipeline inicial de CI/CD: Igor
  (DevOps) é R; Adrian (Full-stack) é A.
* Estruturar o backend (FastAPI) e modelar os módulos de domínio: Adrian
  (Full-stack) é R; Gabriel (Eng. Requisitos) é A; Igor (DevOps) é C.
* Levantar e documentar os requisitos e regras de negócio: Gabriel (Eng.
  Requisitos) é R; Diego (PO) é A; Renato (QA) é C.

## Backlog

O backlog do produto e as histórias de usuário vivem nas
**[issues deste repositório](https://github.com/igorSeberino/api.ludens/issues)**
(`igorSeberino/api.ludens`, monorepo com `apps/api`, `apps/web`, `docs` e
`pipelines`). A pasta `docs/` guarda os requisitos e os padrões; os itens de
backlog ficam só nas issues.

Cada feature é fatiada em issues por superfície (Backend / Frontend), seguindo
[`ISSUE_TEMPLATE.md`](templates/ISSUE_TEMPLATE.md). Campos do quadro: `Area`
(backend/frontend/infra/docs), `Priority` (3 é o mais importante, 0 é o
menos importante), `Issue Type` (feature/task/refactor/bug), `Status`
(Backlog/In Progress/Done). Labels: `module: *`, `N1`/`N2`/`N3`,
`débito técnico`.

## Qualidade: DoR e DoD

Versão operacional do [Acordo de Manutenibilidade §3](maintainability.md).

### Definition of Ready (DoR): pronto para desenvolver

Validado pelo QA em conjunto com o Engenheiro de Requisitos. Um card só
entra em desenvolvimento quando:

* [ ] A história está no formato *"Como [papel], eu quero [funcionalidade] para
      que [benefício]"*.
* [ ] Os critérios de aceitação são objetivos e verificáveis.
* [ ] Regras de negócio essenciais e exceções especificadas (ex.: limite de
      ingressos por CPF, política de reembolso, expiração da reserva; ver
      [regras de negócio](../product/overview.md#regras-de-negócio-rn01rn05)).
* [ ] Dependências técnicas mapeadas (ex.: gateway de pagamento, esquema do
      banco, e-mail de confirmação).
* [ ] Layout/protótipo da interface aprovado, quando aplicável.

### Definition of Done (DoD): pronto para entrega

Um card só é *Done* quando:

* [ ] O código segue o [guia de estilo](../backend/code-style.md).
* [ ] Passou por Code Review: **PR aprovado por, no mínimo, outro
      desenvolvedor**.
* [ ] A funcionalidade foi validada conforme a
      [estratégia de teste](../backend/testing.md), sem erros críticos.
* [ ] Os testes automatizados relevantes foram criados/atualizados e estão
      passando na pipeline.
* [ ] Código integrado em `master` sem quebrar o build.

### Relação com os templates de issue

O monorepo traz o checklist de DoR nos templates de história de usuário
(`.github/ISSUE_TEMPLATE/`) e o checklist de DoD nos templates de Pull Request
(`.github/PULL_REQUEST_TEMPLATE/`).

## Gestão de débito técnico

Versão operacional do [Acordo de Manutenibilidade §2](maintainability.md).

### Política de registro

Todo atalho técnico, pendência de refatoração ou *workaround* é registrado
**imediatamente** no backlog (issues deste repositório) como uma issue do
tipo **Débito Técnico**, contendo:

* descrição do problema;
* motivo do atalho;
* impacto estimado;
* proposta de solução.

O template de issue "Débito Técnico" (`.github/ISSUE_TEMPLATE/debito-tecnico.md`)
traz esses campos, e a label `débito técnico` existe neste repositório.

### Orçamento de ciclo

A equipe reserva **cerca de 15% do esforço de cada ciclo** para liquidar débitos
técnicos registrados.

### Priorização

Têm **prioridade máxima** e são tratados no ciclo seguinte (validados com o PO no
planejamento) os débitos que afetam:

* **Segurança:** dados de compradores ou de pagamento;
* **Desempenho:** por exemplo, consulta de disponibilidade de ingressos;
* **O trabalho de outro membro** do time.

### Débitos conhecidos hoje

Os débitos da N3 que ficaram fora do escopo da entrega de 27/11 estão
registrados como issues com a label `débito técnico`: DT-01, DT-02, DT-03,
DT-06, DT-07, DT-08, DT-14 e DT-15. Consulte a
[lista](https://github.com/igorSeberino/api.ludens/issues?q=is%3Aissue+label%3A%22d%C3%A9bito+t%C3%A9cnico%22).

As rotas de autenticação já estão alinhadas sob `/api/identity`; o débito
anterior de prefixos não está aberto no código atual.

A branch `feat/buyer-account-management` implementa a navegação, o
autoatendimento e as páginas de confirmação antes ausentes. Contratos,
política de preservação e testes estão em
[conta do comprador](../specs/identity-user-management/buyer-account.md).
A publicação dessa fatia depende de integração e aceite; sua implementação
não entrega reservas, pagamento nem listagem administrativa de usuários.

Registro histórico da preparação pela equipe anterior:

* **CODEOWNERS / handles desatualizados na separação de repos.** Origem:
  migração do monorepo. Resolução: `CODEOWNERS` unificado na raiz do monorepo
  (`.github/CODEOWNERS`).
* **Meia-entrada exigindo documento de estudante contra a RN04.** Origem:
  ERS original. Resolução: sem código, virou critério de aceite da
  funcionalidade `booking-ticket-issuance`; ver
  [RN04](../product/overview.md#rn04-meia-entrada).

## Fluxo Trunk-Based Development

Versão operacional do [Acordo de Manutenibilidade §6](maintainability.md#6-fluxo-de-versionamento-e-pipeline-de-cicd).
`master` é a única branch de longa duração: sempre estável, integrável e apta
a implantação. Todo trabalho passa pelos passos abaixo, cada um com seu papel
da Matriz RACI acima. Os templates citados vivem em
[`team/templates/`](templates/).

### 1. Abrir a issue

Toda tarefa nasce como issue neste repositório
[issues do repositório](https://github.com/igorSeberino/api.ludens/issues), escrita a partir de
[`ISSUE_TEMPLATE.md`](templates/ISSUE_TEMPLATE.md), que identifica o escopo
(história de usuário, critérios de aceitação, área, dependências técnicas). Só
entra em desenvolvimento depois de bater o
[Definition of Ready](#definition-of-ready-dor-pronto-para-desenvolver).

* R: quem vai implementar (Frontend ou Backend, conforme a área).
* A: PO, que também é quem organiza e prioriza o backlog.
* C: QA e Engenheiro de Requisitos, que validam o DoR em conjunto.

### 2. Criar a branch

Branch de curta duração a partir de `master`, no padrão
`feature/nome-da-funcionalidade` ou `fix/descricao-do-bug`, reintegrada em
poucos dias. Funcionalidade incompleta é protegida por feature flag quando
necessário.

* R: quem implementa (Frontend ou Backend).

### 3. Commitar

Commits pequenos e frequentes, seguindo
[`COMMIT_TEMPLATE.md`](templates/COMMIT_TEMPLATE.md) (padrão
[Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat`,
`fix`, `refactor`, `docs`, `test`, `chore`), mensagem em português no
imperativo.

* R: quem implementa.

### 4. Abrir o Pull Request

PR pequeno, escrito a partir de
[`PULL_REQUEST_TEMPLATE.md`](templates/PULL_REQUEST_TEMPLATE.md), referenciando
a issue e trazendo o checklist de
[Definition of Done](#definition-of-done-dod-pronto-para-entrega).

* R: autor do PR (quem implementou).
* C: QA, quando o PR mexe em fluxo coberto pelo roteiro de teste manual.

### 5. Code review e pipeline

Nenhum PR é aprovado sem pelo menos **1 aprovação de outro desenvolvedor**, e
sem a pipeline verde: lint do frontend sem erro crítico e testes automatizados
do backend passando, além do build Docker subindo sem erro.

* R: outro desenvolvedor (Frontend revisa Backend ou vice-versa, conforme o
  que o PR toca).
* A: mesmo revisor, que aprova ou pede mudança.

### 6. Merge em `master`

Só depois da aprovação e da pipeline verde. `master` nunca fica quebrada.

* R: autor do PR, depois de aprovado.

### 7. Débito técnico, quando houver atalho

Todo atalho assumido durante a implementação vira issue de **Débito Técnico**
imediatamente, seguindo a
[política de registro](#política-de-registro).

* R: quem assumiu o atalho.
* A: PO, que prioriza o pagamento do débito no planejamento do ciclo
  seguinte.
