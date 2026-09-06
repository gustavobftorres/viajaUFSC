# Coletor SINTER/UFSC

Coletor em Python dos dados públicos de internacionalização publicados pela
[Secretaria de Relações Internacionais da UFSC (SINTER)](https://sinter.ufsc.br/).
Ele normaliza editais/chamadas/cursos e convênios internacionais em um banco
SQLite local, com atualizações idempotentes e execução apropriada para cron ou
um agendador de containers.

O projeto somente lê páginas públicas. Ele não autentica, publica ou altera
conteúdo na UFSC.

## Arquitetura

```text
CLI (`sinter-collector`)
  ├── HttpClient: identificação, timeout, intervalo e retries
  ├── notices: API WordPress → parser de tabelas → Notice
  ├── agreements: 7 páginas continentais → parser de cards → Agreement
  └── Database: schema e UPSERT condicional → SQLite
```

Os módulos ficam em `src/sinter_collector/`. Os coletores recebem um cliente
HTTP e um banco explicitamente, o que mantém os parsers testáveis com fixtures
locais e sem acesso à rede.

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

O schema completo e executável está em `src/sinter_collector/storage.py`.

## Pré-requisitos e instalação

- Python 3.11 ou superior; ou
- Docker, para a execução isolada.

Instalação local para uso:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pip install --no-deps .
```

Para desenvolver e executar os testes:

```bash
python -m pip install -r requirements-dev.txt
python -m pip install -e .
pytest
```

## CLI

O caminho padrão do banco é `/data/sinter.db`, adequado ao container. Em uma
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

## Docker e persistência

Construa a imagem e use um volume nomeado montado em `/data`; esse volume
preserva o SQLite entre containers:

```bash
docker build -t sinter-ufsc-collector .
docker volume create sinter-ufsc-data
docker run --rm -v sinter-ufsc-data:/data sinter-ufsc-collector init-db
docker run --rm -v sinter-ufsc-data:/data sinter-ufsc-collector collect all
```

As variáveis HTTP podem ser passadas com `-e`, por exemplo:

```bash
docker run --rm \
  -e SINTER_COLLECTOR_DELAY=2 \
  -e SINTER_COLLECTOR_USER_AGENT='viajaUFSC/0.1 (contato: seu-email@example.com)' \
  -v sinter-ufsc-data:/data \
  sinter-ufsc-collector collect all
```

O container roda como usuário sem privilégios. Para bind mounts em vez de um
volume nomeado, o diretório no host precisa permitir escrita pelo UID/GID do
usuário `collector` da imagem.

### Agendamento com cron

Exemplo local, todos os dias às 06:15, com caminhos absolutos:

```cron
15 6 * * * /opt/viajaufsc/.venv/bin/sinter-collector --database /var/lib/viajaufsc/sinter.db collect all >> /var/log/viajaufsc-collector.log 2>&1
```

Exemplo usando Docker e o volume persistente, todos os dias às 06:30:

```cron
30 6 * * * /usr/bin/docker run --rm -v sinter-ufsc-data:/data sinter-ufsc-collector collect all >> /var/log/viajaufsc-collector.log 2>&1
```

O timezone é o do host que executa o cron. Evite execuções concorrentes sobre
o mesmo SQLite; se isso for possível no agendador, use um lock externo.

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

A suíte não depende da disponibilidade da SINTER. As fixtures em
`tests/fixtures/` representam a resposta WordPress e cards HTML de convênios;
clientes falsos exercitam fetch, parsing, persistência e idempotência.

```bash
pytest
python -m compileall -q src tests
```

Os testes cobrem, entre outros casos, URLs relativas, datas inválidas, campos
opcionais, instituições duplicadas, reordenação de cards, transição de edital
aberto para encerrado, atualização de conteúdo e configuração HTTP.

## Limites conhecidos

- O coletor reflete o HTML/JSON disponível no momento. Mudanças estruturais no
  WordPress, nos títulos das colunas ou nos cards podem exigir ajuste do parser.
- Registros removidos da fonte não são apagados nem marcados como inativos; o
  banco representa o último estado observado de cada identidade.
- A inferência de tipo de convênio reconhece somente alguns termos públicos
  (`dupla diplomação`, `cotutela` e `acordo específico`).
- Datas não reconhecidas são preservadas como texto nos convênios e em
  `deadline_text` nos editais, em vez de serem descartadas.
- SQLite é indicado para uma única rotina/coletor de pequeno porte. O projeto
  não implementa lock distribuído, exportação, API de consulta ou observabilidade.
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

## Ciclos com revisão independente

Cada fatia abaixo seguiu o mesmo gate: implementação por um agente, revisão
independente do diff e dos testes por outro agente, correção das críticas e só
então commit. Os assuntos identificam os ciclos sem depender do hash do próprio
commit:

| Ciclo | Assunto do commit |
| --- | --- |
| Foundation | `chore: scaffold collector foundation` |
| Notices | `feat: collect notices from WordPress API` |
| Agreements | `feat: collect agreements across seven continents` |
| Docs/integration | `docs: document and validate collector operations` |

Nenhuma etapa deste projeto publica ou faz deploy externo.
