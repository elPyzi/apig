# CLI

## 命令

### `apig generate`（别名 `g`）

运行代码生成。

```bash
apig generate
```

**标志：**

| 标志 | 描述 |
|------|------|
| `-c, --config <path>` | 配置文件的路径（默认为 `apig.config.ts`） |
| `-d, --dry-run` | 预览而不写入文件 |
| `-w, --watch` | 监视规范和配置的更改 |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

使用 `--watch` 时，对于本地规范文件，配置和规范文件本身的更改都会被监听。对于通过 URL 提供的规范，不支持监听文件——只监听配置。

---

### `apig start`（别名 `s`）

交互式配置向导——通过终端中的对话式问题选择插件和输出参数。

```bash
apig start
```

---

### `apig config`（别名 `c`）

在当前目录下创建 `apig.config.ts` 文件。该命令**不会**输出当前配置——它只会生成一个新的配置文件模板。

```bash
apig config
```

如果 `apig.config.ts` 已存在，该命令将以错误结束。

**标志：**

| 标志 | 描述 |
|------|------|
| `-p, --preset <name>` | 使用某个预设 |
| `--list-presets` | 显示可用预设列表并退出 |

```bash
apig config --list-presets
apig config --preset react
```

**可用预设：**

| 预设 | 描述 |
|------|------|
| `minimal` | TypeScript 类型 + SDK fetch 函数 |
| `react` | TypeScript + SDK + TanStack Query + Zod（标准 React 技术栈） |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | React 技术栈 + Faker 工厂函数 + MSW 处理程序，用于模拟测试 |
| `forms` | TypeScript + SDK + Zod + React Hook Form 解析器 |
| `full` | 一次性启用所有插件 |

---

### `apig info`（别名 `i`）

显示已加载规范的统计信息，而不生成任何文件：API 名称和版本、输入/输出路径、`groupBy`、操作数量（按方法细分）、模式数量、标签列表、已启用的插件。

```bash
apig info
```

**标志：**

| 标志 | 描述 |
|------|------|
| `-c, --config <path>` | 配置文件的路径（默认为 `apig.config.ts`） |

---

### `apig versions`

列出所有已保存的快照（需要在配置中启用 `versioning.enabled`）。

```bash
apig versions
```

**标志：**

| 标志 | 描述 |
|------|------|
| `-c, --config <path>` | 配置文件的路径 |
| `-s, --storage <path>` | 快照存储目录（覆盖配置） |

输出列：别名、快照 ID、创建日期。

---

### `apig version checkout <id|alias>`

从已保存的快照重新生成代码。

```bash
apig version checkout abc123
apig version checkout gen5
```

**标志：** `-c, --config <path>`、`--dry-run`

---

### `apig version show <id|alias>`

显示某个快照的详细信息：别名、ID、API 版本、生成编号、创建日期、备注、是否保存了规范。

```bash
apig version show abc123
```

**标志：** `-c, --config <path>`、`-s, --storage <path>`

---

## 自定义配置路径

默认情况下，apig 在当前目录中查找 `apig.config.ts`。使用 `-c` 指向不同的文件：

```bash
apig generate -c ./config/apig.config.ts
```
