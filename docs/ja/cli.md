# CLI

## コマンド

### `apig generate`（エイリアス `g`）

コード生成を実行する。

```bash
apig generate
```

**フラグ:**

| フラグ | 説明 |
|------|----------|
| `-c, --config <パス>` | 設定ファイルへのパス（デフォルト `apig.config.ts`） |
| `-d, --dry-run` | ファイルを書き込まずにプレビュー |
| `-w, --watch` | 仕様と設定の変更を監視 |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

`--watch` 指定時、ローカルファイルの仕様では設定ファイルと仕様ファイルの両方の変更を監視する。URLの仕様では、ファイルの監視はサポートされず、設定のみが監視される。

---

### `apig start`（エイリアス `s`）

対話型セットアップウィザード — ターミナルでの対話形式の質問を通じてプラグインと出力オプションを選択する。

```bash
apig start
```

---

### `apig config`（エイリアス `c`）

現在のディレクトリに `apig.config.ts` ファイルを作成する。このコマンドは現在の設定を出力する**わけではない** — 新しい雛形ファイルを生成する。

```bash
apig config
```

`apig.config.ts` がすでに存在する場合、このコマンドはエラーで終了する。

**フラグ:**

| フラグ | 説明 |
|------|----------|
| `-p, --preset <name>` | 用意されたプリセットのいずれかを使用 |
| `--list-presets` | 利用可能なプリセットの一覧を表示して終了 |

```bash
apig config --list-presets
apig config --preset react
```

**利用可能なプリセット:**

| プリセット | 説明 |
|--------|----------|
| `minimal` | TypeScript型 + SDK fetch関数 |
| `react` | TypeScript + SDK + TanStack Query + Zod（標準的なReactスタック） |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | Reactスタック + Fakerファクトリー + MSWハンドラー（モック用） |
| `forms` | TypeScript + SDK + Zod + React Hook Formリゾルバー |
| `full` | すべてのプラグインを一度に |

---

### `apig info`（エイリアス `i`）

ファイルを生成せずに、読み込んだ仕様の統計情報を表示する。API名とバージョン、入出力パス、`groupBy`、オペレーション数（メソッド別内訳）、スキーマ数、タグの一覧、接続されたプラグイン。

```bash
apig info
```

**フラグ:**

| フラグ | 説明 |
|------|----------|
| `-c, --config <パス>` | 設定ファイルへのパス（デフォルト `apig.config.ts`） |

---

### `apig versions`

保存されたすべてのスナップショットの一覧（設定で `versioning.enabled` を有効にする必要がある）。

```bash
apig versions
```

**フラグ:**

| フラグ | 説明 |
|------|----------|
| `-c, --config <パス>` | 設定ファイルへのパス |
| `-s, --storage <パス>` | スナップショット保存ディレクトリ（設定を上書き） |

列: エイリアス、スナップショットID、作成日。

---

### `apig version checkout <id|alias>`

保存されたスナップショットからコードを再生成する。

```bash
apig version checkout abc123
apig version checkout gen5
```

**フラグ:** `-c, --config <パス>`、`--dry-run`

---

### `apig version show <id|alias>`

スナップショットの詳細情報: エイリアス、ID、APIバージョン、生成番号、作成日、コメント、保存された仕様の有無。

```bash
apig version show abc123
```

**フラグ:** `-c, --config <パス>`、`-s, --storage <パス>`

---

## カスタム設定パス

デフォルトでは、apig は現在のディレクトリで `apig.config.ts` を探す。別のファイルを指定するには `-c` を使用する。

```bash
apig generate -c ./config/apig.config.ts
```
