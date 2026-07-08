# Contributing to @travjek/apig

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

**Requirements:** [Bun](https://bun.sh) >= 1.0

```bash
git clone https://github.com/elPyzi/apig.git
cd apig
bun install
```

Run tests:

```bash
bun test
```

Build:

```bash
bun run build
```

## How to Contribute

### Reporting Bugs

Open a [GitHub Issue](https://github.com/elPyzi/apig/issues) and include:

- `@travjek/apig` version
- Your `apig.config.ts`
- The OpenAPI spec (or a minimal reproduction)
- Expected vs actual output

### Suggesting Features

Open an issue with the `enhancement` label. Describe the use case, not just the solution.

### Submitting a Pull Request

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests if needed
4. Make sure all tests pass: `bun test`
5. Open a PR with a clear description of what and why

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add valibot strict mode option
fix: resolve nullable union type generation
docs: update sdk plugin examples
chore: bump dependencies
```

## Writing a Plugin

See [docs/custom-plugin.md](./docs/custom-plugin.md) for a full guide on building your own plugin.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
