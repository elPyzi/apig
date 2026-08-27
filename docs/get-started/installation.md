apig runs as a CLI tool. Install the package into your project and you're ready to generate code.

## Install in your project

**npm**

```bash
npm install @travjek/apig
```

**yarn**

```bash
yarn add @travjek/apig
```

**pnpm**

```bash
pnpm add @travjek/apig
```

**bun**

```bash
bun add @travjek/apig
```

> **No global install needed**
>
> apig reads config from the current directory, so it's installed as a project dependency. Run it with `npx` / `bunx` / `pnpm dlx` / `yarn dlx`.

## Requirements

- `Node.js ≥ 18` or `Bun`
- `TypeScript ≥ 5.0` — the only required peer dependency

## Peer dependencies

apig doesn't pull in anything extra on its own. The libraries your generated code targets are installed separately — only the ones whose plugins you enable in the config.

For example, for the `react` preset:

**npm**

```bash
npm install @tanstack/react-query zod
```

**yarn**

```bash
yarn add @tanstack/react-query zod
```

**pnpm**

```bash
pnpm add @tanstack/react-query zod
```

**bun**

```bash
bun add @tanstack/react-query zod
```

Which packages each plugin needs:

- `zod()` → `zod`
- `valibot()` → `valibot`
- `yup()` → `yup`
- `tanstackQuery()` → `@tanstack/react-query`
- `swr()` → `swr`
- `rhf()` → `react-hook-form`, `@hookform/resolvers` and one of the validation libraries
- `faker()` → `@faker-js/faker`
- `msw()` → `msw`, `@faker-js/faker`
- `mcp()` → `@modelcontextprotocol/sdk`

The `typescript()` and `sdk()` plugins don't need any extra packages.

## Verify the install

**npm**

```bash
npx apig --version
```

**yarn**

```bash
yarn dlx apig --version
```

**pnpm**

```bash
pnpm dlx apig --version
```

**bun**

```bash
bunx apig --version
```
