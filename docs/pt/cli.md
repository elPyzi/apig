# CLI

## Comandos

### `apig generate` (alias `g`)

Executa a geração de código.

```bash
apig generate
```

**Flags:**

| Flag | Descrição |
|------|-----------|
| `-c, --config <caminho>` | Caminho para o arquivo de configuração (padrão `apig.config.ts`) |
| `-d, --dry-run` | Pré-visualização sem escrever arquivos |
| `-w, --watch` | Monitorar mudanças na especificação e na configuração |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

Com `--watch`, para especificações locais são monitoradas tanto as mudanças na configuração quanto no próprio arquivo de especificação. Para especificações via URL o monitoramento do arquivo não é suportado — apenas o da configuração.

---

### `apig start` (alias `s`)

Assistente interativo de configuração — escolha de plugins e parâmetros de saída por meio de perguntas no terminal.

```bash
apig start
```

---

### `apig config` (alias `c`)

Cria um arquivo `apig.config.ts` no diretório atual. O comando **não** exibe a configuração atual — ele gera um novo arquivo de modelo.

```bash
apig config
```

Se `apig.config.ts` já existir, o comando falhará com um erro.

**Flags:**

| Flag | Descrição |
|------|-----------|
| `-p, --preset <name>` | Usar um dos presets prontos |
| `--list-presets` | Mostrar a lista de presets disponíveis e sair |

```bash
apig config --list-presets
apig config --preset react
```

**Presets disponíveis:**

| Preset | Descrição |
|--------|-----------|
| `minimal` | Tipos TypeScript + funções SDK fetch |
| `react` | TypeScript + SDK + TanStack Query + Zod (stack React padrão) |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | Stack React + fábricas Faker + handlers MSW para mocking |
| `forms` | TypeScript + SDK + Zod + resolvers React Hook Form |
| `full` | Todos os plugins de uma vez |

---

### `apig info` (alias `i`)

Mostra estatísticas sobre a especificação carregada sem gerar arquivos: nome e versão da API, caminho de entrada/saída, `groupBy`, quantidade de operações (com detalhamento por método), quantidade de esquemas, lista de tags, plugins conectados.

```bash
apig info
```

**Flags:**

| Flag | Descrição |
|------|-----------|
| `-c, --config <caminho>` | Caminho para o arquivo de configuração (padrão `apig.config.ts`) |

---

### `apig versions`

Lista todos os snapshots salvos (requer `versioning.enabled` habilitado na configuração).

```bash
apig versions
```

**Flags:**

| Flag | Descrição |
|------|-----------|
| `-c, --config <caminho>` | Caminho para o arquivo de configuração |
| `-s, --storage <caminho>` | Diretório de armazenamento dos snapshots (sobrescreve a configuração) |

Colunas: alias, ID do snapshot, data de criação.

---

### `apig version checkout <id|alias>`

Regera o código a partir de um snapshot salvo.

```bash
apig version checkout abc123
apig version checkout gen5
```

**Flags:** `-c, --config <caminho>`, `--dry-run`

---

### `apig version show <id|alias>`

Informações detalhadas sobre um snapshot: alias, ID, versão da API, número da geração, data de criação, comentário, presença de especificação salva.

```bash
apig version show abc123
```

**Flags:** `-c, --config <caminho>`, `-s, --storage <caminho>`

---

## Caminho de configuração personalizado

Por padrão, o apig procura `apig.config.ts` no diretório atual. Use `-c` para apontar para um arquivo diferente:

```bash
apig generate -c ./config/apig.config.ts
```
