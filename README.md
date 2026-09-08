# viajaUFSC

Coletor em Python dos dados públicos de internacionalização publicados pela
[Secretaria de Relações Internacionais da UFSC (SINTER)](https://sinter.ufsc.br/).
Ele normaliza editais/chamadas/cursos e convênios internacionais. O backend em
`apps/api` persiste os dados de forma idempotente no PostgreSQL e os expõe via
FastAPI; o CLI SQLite original continua disponível para compatibilidade local.

O projeto somente lê páginas públicas. Ele não autentica, publica ou altera
conteúdo na UFSC.

## Arquitetura do monorepo

```text
viajaUFSC/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── sinter_collector/  # fetch, parsing e CLI SQLite legado
│   │   │   └── viajaufsc_api/     # FastAPI, collector PostgreSQL e acesso a dados
│   │   ├── alembic/               # migrations PostgreSQL
│   │   ├── tests/                 # testes da API, banco e collector PostgreSQL
│   │   ├── .env.example
│   │   └── pyproject.toml
│   └── web/
│       ├── src/app/               # rotas e estados do Next.js App Router
│       ├── src/components/        # composição e componentes shadcn/ui
│       ├── src/lib/               # cliente da API, normalização e filtros
│       └── .env.example           # origens públicas configuráveis
├── tests/                         # testes e fixtures do coletor SINTER
├── Dockerfile
├── render.yaml                    # Blueprint do web service no Render
├── requirements.txt
└── requirements-dev.txt
```

## Frontend

O frontend fica em `apps/web` e usa Next.js App Router, TypeScript, Tailwind CSS
e componentes shadcn/ui. A leitura da API ocorre nos Server Components; filtros
e paginação são representados na URL, permitindo compartilhar uma consulta e
mantendo o cliente leve. Os payloads externos são validados e normalizados em
`src/lib/api.ts` antes de chegar aos componentes.

Copie `apps/web/.env.example` para `apps/web/.env.local` somente quando precisar
trocar uma origem. Arquivos `.env*` preenchidos não devem ser versionados.

| Variável | Uso | Padrão quando vazia |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Origem HTTP da API FastAPI | API pública do viajaUFSC no Render |
| `NEXT_PUBLIC_SITE_URL` | Origem pública do frontend para metadados absolutos | Metadados sem domínio inventado |

```bash
npm install
npm run web:dev
npm run web:test
npm run web:lint
npm run web:build
```

Os aliases `npm test`, `npm run lint` e `npm run build` executam a mesma suíte do
workspace web. O servidor local do Next.js fica em `http://localhost:3000`.

### Rotas do frontend

| Rota | Conteúdo |
| --- | --- |
| `/` | Landing page e prévia do catálogo |
| `/oportunidades` | Oportunidades paginadas, com status e período de prazo |
| `/oportunidades/{id}` | Detalhe e link para a fonte de uma oportunidade |
| `/instituicoes` | Convênios paginados por continente, país, área e disponibilidade |
| `/instituicoes/{id}` | Detalhe, proveniência e vigência de um convênio |
| `/sobre-os-dados` | Fonte, pipeline, atualização e limitações do catálogo |

O app também possui estados de carregamento, erro e não encontrado coerentes
com a interface. A navegação oferece um atalho para o conteúdo principal e menu
móvel acessível. **O frontend ainda não foi publicado**; não há configuração de
deploy do app web neste repositório.

O processo `uvicorn` atende HTTP em `/api/v1` e usa SQLAlchemy assíncrono com
`asyncpg`. O comando `viajaufsc-collect` reutiliza os parsers SINTER e faz UPSERT
idempotente no mesmo PostgreSQL. O CLI `sinter-collector` mantém o SQLite para
compatibilidade e desenvolvimento local. Dependências injetáveis e fixtures
locais permitem testar parsing, API e persistência sem rede.

## API HTTP

Com a aplicação em execução, a documentação interativa fica em
`http://localhost:8000/api/v1/docs`, o ReDoc em `/api/v1/redoc` e o schema
OpenAPI em `/api/v1/openapi.json`.

| Método e rota | Finalidade | Filtros |
| --- | --- | --- |
| `GET /api/v1/health` | Verifica se o processo está disponível, sem consultar o banco | — |
| `GET /api/v1/opportunities` | Lista editais/oportunidades | `page`, `page_size`, `status`, `deadline_from`, `deadline_to` |
| `GET /api/v1/opportunities/{external_id}` | Detalha uma oportunidade | — |
| `GET /api/v1/institutions` | Lista instituições conveniadas | `page`, `page_size`, `continent`, `country`, `subject_area`, `exchange_available` |
| `GET /api/v1/institutions/{external_id}` | Detalha uma instituição | — |

As páginas começam em 1, têm 20 itens por padrão e aceitam no máximo 100. Os
filtros de continente, país e status não diferenciam maiúsculas de minúsculas;
`subject_area` busca um trecho. Datas usam `AAAA-MM-DD`. Respostas de erro seguem
o envelope `{"error":{"code":"...","message":"...","details":...}}`.
Atualmente a SINTER não publica um indicador estruturado de intercâmbio para os
convênios coletados, portanto `exchange_available` é persistido como nulo até
que exista uma regra de origem confiável.

### Fontes públicas

- Editais, chamadas e cursos: endpoint público da página WordPress
  `https://sinter.ufsc.br/wp-json/wp/v2/pages/12370?lang=pt`.
- Convênios: páginas de instituições conveniadas para África, América Central,
  América do Norte, América do Sul, Ásia, Europa e Oceania sob
  `https://sinter.ufsc.br/instituicoes-conveniadas/`.

Em ambas as tabelas, `source_url` é a URL da fonte efetivamente consultada.
Nos convênios, `canonical_url` é o site da instituição extraído do card ou fica
nulo quando não há link. Nos editais, é o link extraído da linha; quando a linha
não tem link, o fallback é a URL pública da página retornada pelo WordPress (ou,
se ela também estiver ausente, a própria `source_url`). Assim, a proveniência
não depende de o item ter página própria.

## Schema e campos

`init-db` cria as tabelas e também adiciona colunas ausentes em bancos de
versões anteriores. A migração é aditiva; nenhum dado existente é removido.

| Tabela | Campo | Significado |
| --- | --- | --- |
| ambas | `external_id` | Chave primária SHA-256 derivada da identidade normalizada |
| ambas | `source_url` | Fonte pública consultada pelo coletor |
| ambas | `canonical_url` | Link do item/instituição, quando publicado |
| ambas | `content_hash` | SHA-256 de todos os campos normalizados do registro |
| ambas | `first_seen_at` | Primeira observação, em UTC |
| ambas | `updated_at` | Última mudança de conteúdo, em UTC |
| `notices` | `title`, `body` | Título escolhido e texto normalizado da linha |
| `notices` | `kind`, `status` | `edital`, `chamada` ou `curso`; `open` ou `closed` quando identificável |
| `notices` | `program`, `link_text`, `audience` | Campos publicados na tabela da SINTER |
| `notices` | `application_deadline` | Prazo ISO `AAAA-MM-DD`, se a data for válida |
| `notices` | `deadline_text` | Prazo original, inclusive textos ou datas inválidas |
| `notices` | `published_at`, `modified_at` | Reservados para datas próprias do item; podem ser nulos |
| `agreements` | `institution`, `continent`, `country` | Localização e instituição conveniada |
| `agreements` | `start_date`, `end_date` | Datas ISO quando reconhecidas; texto original caso contrário |
| `agreements` | `agreement_type`, `subject_area` | Tipo explícito/inferido e área publicada |
| `agreements` | `details` | Demais campos públicos do card, concatenados e normalizados |

O schema SQLite legado está em `apps/api/src/sinter_collector/storage.py`; o
schema PostgreSQL é gerenciado pelas migrations em `apps/api/alembic/`.

## Configuração e segredos

Copie apenas os nomes e exemplos seguros de `apps/api/.env.example` para
`apps/api/.env`; nunca versione o arquivo preenchido. A configuração aceita os
nomes prefixados abaixo e também `DATABASE_URL`/`DATABASE_URL_UNPOOLED`, como
gerados pela CLI Neon.

| Variável | Uso |
| --- | --- |
| `VIAJAUFSC_DATABASE_URL` | Conexão pooled (host com `-pooler`) da API e do coletor |
| `VIAJAUFSC_DATABASE_URL_UNPOOLED` | Conexão direta, obrigatória para Alembic |
| `VIAJAUFSC_CORS_ORIGINS` | Lista JSON de origens React permitidas, por exemplo `["http://localhost:5173"]` |

O pooler da Neon é apropriado para o tráfego normal. Migrations precisam da URL
direta porque dependem de uma sessão PostgreSQL estável. URLs são normalizadas
para o driver `asyncpg`; erros de CLI e banco não exibem credenciais. Sem URL de
banco, o health check continua respondendo e o catálogo retorna HTTP 503.

O scaffold opcional de Function e bucket criado pelo `neon init` foi removido,
pois esta arquitetura usa somente o PostgreSQL da Neon. As skills Neon ficam
instaladas localmente em `.agents/` e não fazem parte da aplicação. Nenhum
serviço Neon adicional foi provisionado.

## Pré-requisitos e instalação local

- Python 3.11 ou superior; ou
- Docker, para a execução isolada.

Instale o pacote único de `apps/api`, que contém tanto a API quanto os dois
entrypoints do coletor:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Para desenvolver, instale também as dependências de teste:

```bash
python -m pip install -r requirements-dev.txt
```

Inicie a API na raiz do repositório:

```bash
uvicorn viajaufsc_api.main:app --reload --host 127.0.0.1 --port 8000
```

### Migrations

Execute o Alembic a partir de `apps/api`, com a conexão direta configurada em
`apps/api/.env`:

```bash
cd apps/api
alembic upgrade head
alembic current
```

A migration `20260906_0001` cria `opportunities` e `institutions`, incluindo
chaves externas estáveis, hashes de conteúdo, timestamps de observação e os
índices usados pelos filtros do catálogo. Ela já foi aplicada no banco Neon
selecionado durante a preparação do backend. Para mudanças futuras, execute as
migrations primeiro em uma branch Neon de desenvolvimento e somente depois de
revisar a URL e o projeto selecionados.

## CLI

No CLI SQLite legado, o caminho padrão do banco é `/data/sinter.db`. Em uma
instalação local, informe um caminho gravável com `--database` (a opção global
vem antes do subcomando):

```bash
sinter-collector --database ./data/sinter.db init-db
sinter-collector --database ./data/sinter.db collect notices
sinter-collector --database ./data/sinter.db collect agreements
sinter-collector --database ./data/sinter.db collect all
```

`collect` inicializa/atualiza o schema automaticamente. `init-db` é útil para
provisionamento e verificação explícita. Ao terminar, cada coletor informa a
quantidade de registros alterados e inalterados. Uma falha HTTP, JSON/HTML
inválido ou erro do SQLite encerra o processo com código diferente de zero.
Uma resposta sem nenhuma linha/card reconhecível também falha explicitamente,
em vez de registrar como bem-sucedida uma página vazia ou em manutenção.

Também é possível executar sem instalar o entrypoint, após instalar as
dependências e o pacote:

```bash
python -m sinter_collector --database ./data/sinter.db collect all
```

Para persistir no PostgreSQL usado pela API, configure a URL pooled e execute:

```bash
viajaufsc-collect notices
viajaufsc-collect agreements
viajaufsc-collect all
```

### Configuração HTTP

| Variável | Padrão | Regra |
| --- | ---: | --- |
| `SINTER_COLLECTOR_TIMEOUT` | `15` | Timeout de cada requisição, em segundos; deve ser maior que zero |
| `SINTER_COLLECTOR_RETRIES` | `2` | Novas tentativas para GET em falhas de conexão/leitura e HTTP 429/5xx; inteiro de 0 a 10 |
| `SINTER_COLLECTOR_DELAY` | `1` | Intervalo mínimo entre requisições do cliente, em segundos; não negativo |
| `SINTER_COLLECTOR_USER_AGENT` | `sinter-ufsc-collector/0.1 (+https://github.com/gustavobftorres/viajaUFSC)` | Identificação enviada ao servidor |

Exemplo conservador para uma rede lenta:

```bash
export SINTER_COLLECTOR_TIMEOUT=30
export SINTER_COLLECTOR_RETRIES=3
export SINTER_COLLECTOR_DELAY=2
export SINTER_COLLECTOR_USER_AGENT='viajaUFSC/0.1 (contato: seu-email@example.com)'
sinter-collector --database ./data/sinter.db collect all
```

As novas tentativas usam backoff e respeitam `Retry-After`. Valores explícitos
passados à API Python de `HttpClient` têm precedência sobre o ambiente.

## Docker

Construa e execute a API FastAPI na porta 8000. Passe segredos somente em tempo
de execução; eles não são incorporados à imagem:

```bash
docker build -t viajaufsc-api .
docker run --rm -p 8000:8000 --env-file apps/api/.env viajaufsc-api
```

O mesmo artefato contém o coletor PostgreSQL. Para executá-lo como job, substitua
o comando padrão:

```bash
docker run --rm --env-file apps/api/.env viajaufsc-api viajaufsc-collect all
```

O container roda como usuário sem privilégios. Use `DATABASE_URL_UNPOOLED` para
migrations e a URL pooled em `DATABASE_URL` para API e coletor.

## Deploy no Render

O arquivo `render.yaml` define um web service Docker gratuito com health check
em `/api/v1/health`. O deploy automático fica desligado: cada nova versão deve
ser iniciada conscientemente pelo painel do Render depois da revisão dos testes
e das migrations.

Para criar o serviço manualmente pelo Blueprint:

1. Envie a branch revisada para um repositório Git acessível pelo Render.
2. No painel do Render, escolha **New > Blueprint**, conecte a conta GitHub se
   necessário, selecione o repositório e a branch e confirme o `render.yaml`.
3. No campo secreto `DATABASE_URL`, cole a URL **pooled** da Neon (host com
   `-pooler`). Nunca coloque esse valor no Blueprint, em logs ou no Git.
4. Enquanto não houver frontend, configure `VIAJAUFSC_CORS_ORIGINS` exatamente
   como `[]`. Quando o frontend existir, substitua pelo JSON contendo apenas as
   origens exatas, por exemplo `["https://app.example.com"]`. Não use `*` com
   credenciais habilitadas.
5. Crie o serviço, acompanhe o primeiro build e confirme `/api/v1/health` e
   `/api/v1/docs` na URL pública atribuída pelo Render.

O Render injeta `PORT`; o launcher valida esse valor e usa `8000` somente fora
da plataforma. O serviço hospedado recebe apenas `DATABASE_URL`. Não configure
`DATABASE_URL_UNPOOLED` nele: migrations continuam sendo uma etapa separada,
executada localmente com a URL direta e `alembic upgrade head` antes de liberar
uma versão que dependa de schema novo.

O plano gratuito é apropriado para demonstração e desenvolvimento: pode
suspender o serviço após um período sem tráfego, causando latência na primeira
requisição, e está sujeito à franquia mensal e aos limites atuais de CPU e
memória do Render. Consulte os limites vigentes antes de usá-lo para tráfego
crítico. Login/2FA, autorização do GitHub e inserção dos segredos devem ser
feitos pelo proprietário da conta; as credenciais não devem ser enviadas pelo
chat.

### Agendamento com cron

Exemplo local, todos os dias às 06:15, com caminhos absolutos:

```cron
15 6 * * * /opt/viajaufsc/.venv/bin/sinter-collector --database /var/lib/viajaufsc/sinter.db collect all >> /var/log/viajaufsc-collector.log 2>&1
```

Exemplo usando o job PostgreSQL no Docker, todos os dias às 06:30:

```cron
30 6 * * * /usr/bin/docker run --rm --env-file /opt/viajaufsc/apps/api/.env viajaufsc-api viajaufsc-collect all >> /var/log/viajaufsc-collector.log 2>&1
```

O timezone é o do host que executa o cron. No modo SQLite legado, evite
execuções concorrentes; se isso for possível no agendador, use um lock externo.

## Idempotência, hashes e atualizações

- `external_id` identifica a entidade e não o conteúdo atual. Nos editais ele
  combina tipo, URL canônica, programa/título e a posição de ocorrência daquele
  mesmo conjunto de valores durante o parsing (começando em 1). Nos convênios
  combina
  continente, país, instituição, tipo explicitamente rotulado e área.
- `content_hash` é calculado sobre a representação JSON canônica de todos os
  campos normalizados. Qualquer mudança relevante gera outro hash.
- O UPSERT só grava quando o `content_hash` mudou. Recoletar a mesma fonte
  mantém o registro e `updated_at` intactos e o contabiliza como inalterado.
- Quando o conteúdo muda sem mudar a identidade, a mesma linha é atualizada,
  `first_seen_at` é preservado e `updated_at` avança.
- Alterações nos seletores ou na composição da identidade devem ser tratadas
  como migração: elas podem produzir uma nova chave para um item já existente.

## Testes e fixtures

A suíte é inteiramente offline: não acessa a Neon nem a SINTER real. As fixtures
em `tests/fixtures/` representam a resposta WordPress e cards HTML de convênios;
clientes falsos substituem HTTP e SQLite temporário via `aiosqlite` substitui o
PostgreSQL nos testes de integração. Assim são exercitados fetch, parsing,
rotas FastAPI, filtros, transações, persistência e idempotência.

```bash
pytest
python -m compileall -q apps/api/src tests apps/api/tests
```

Os testes cobrem, entre outros casos, URLs relativas, datas inválidas, campos
opcionais, instituições duplicadas, reordenação de cards, transição de edital
aberto para encerrado, atualização de conteúdo e configuração HTTP.

Os testes do frontend usam Vitest e Testing Library, sem depender da Neon ou da
SINTER real. Eles cobrem normalização do contrato da API, filtros, paginação,
cards, navegação móvel, estados globais e conteúdo de transparência. A validação
de cada ciclo inclui também ESLint, build de produção e `git diff --check`:

```bash
npm test
npm run lint
npm run build
```

## Limites conhecidos

- O coletor reflete o HTML/JSON disponível no momento. Mudanças estruturais no
  WordPress, nos títulos das colunas ou nos cards podem exigir ajuste do parser.
- Registros removidos da fonte não são apagados nem marcados como inativos; o
  banco representa o último estado observado de cada identidade.
- A inferência de tipo de convênio reconhece somente alguns termos públicos
  (`dupla diplomação`, `cotutela` e `acordo específico`).
- Datas não reconhecidas são preservadas como texto nos convênios e em
  `deadline_text` nos editais, em vez de serem descartadas.
- O modo SQLite legado é indicado apenas para execução local do coletor; a API
  e o coletor de produção usam PostgreSQL.
- A identidade por conteúdo normalizado é uma aproximação necessária porque as
  páginas de convênios não expõem um identificador estável por acordo.
- Para linhas de edital com tipo, URL e programa/título idênticos, o ordinal de
  ocorrência diferencia as chaves. Reordenar apenas essas duplicatas
  indistinguíveis pode associar uma chave anterior a outra linha do mesmo conjunto.

## Uso responsável das fontes

Respeite os termos e orientações publicados pela UFSC. Mantenha um User-Agent
identificável, intervalos razoáveis e baixa frequência de coleta. Não reduza o
delay nem aumente retries/periodicidade de forma que gere carga desnecessária;
honre respostas 429 e `Retry-After`. Use apenas os dados públicos necessários,
preserve `source_url` para auditoria e não tente contornar autenticação,
bloqueios, rate limits ou controles técnicos.

## Commits do backend e revisão independente

Cada commit abaixo passou pelo gate exigido: implementação por um subagente,
revisão do diff e dos testes por outro subagente independente, correção dos
achados relevantes e testes antes do commit.

| Commit | Fatia | Implementação | Revisão independente |
| --- | --- | --- | --- |
| `10f65d4` | Fundação FastAPI, configuração, CORS, health e erros | concluída | concluída |
| `f1d3416` | SQLAlchemy assíncrono, migration inicial e UPSERT idempotente | concluída | concluída |
| `82e1c8d` | Catálogo paginado, filtros, detalhes e OpenAPI | concluída | concluída |
| `31f8170` | Monorepo, coletor PostgreSQL, Docker e testes de integração | concluída | concluída |

Esta documentação também passou por implementação e revisão independentes; seu
hash é informado no resumo final porque um commit não pode referenciar o próprio
hash. A migration inicial foi aplicada na Neon com autorização e validada antes
desta documentação. Depois desses ciclos, o backend foi revisado, integrado à
`main` e publicado no Render; isso não inclui o frontend.

## Commits do frontend e revisão independente

Cada ciclo abaixo seguiu o mesmo gate: implementação por um subagente, validação
funcional e visual por outro subagente independente, correção dos achados e nova
execução dos testes antes do commit.

| Commit | Fatia | Implementação | Validação funcional e visual |
| --- | --- | --- | --- |
| `941ca2d` | Next.js, shadcn/ui, landing page e integração inicial | concluída | concluída |
| `37627c6` | Catálogo e detalhe de oportunidades | concluída | concluída |
| `e79c59a` | Catálogo e detalhe de instituições/convênios | concluída | concluída |
| este commit (hash no resumo final) | Transparência, acessibilidade, SEO e estados globais | concluída | concluída |

Esses commits pertencem à branch local de frontend criada a partir de
`development`. O app web ainda não foi publicado, e nenhum deploy deve ser
inferido a partir do deploy já existente da API.
