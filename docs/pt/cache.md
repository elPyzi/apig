# Cache

Quando `cache: true`, o apig faz cache do IR (representação intermediária) já analisado, para não precisar baixar e analisar a especificação novamente a cada execução, caso ela não tenha mudado.

## Configuração

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## Como funciona

**Especificações remotas (URL):**

1. Na primeira execução — baixa e analisa a especificação, salva o IR e o ETag em `.apig/cache/`
2. Nas execuções seguintes — envia o cabeçalho `If-None-Match` com o ETag em cache
3. Se o servidor retornar `304 Not Modified` — usa o IR em cache, pulando novo download e nova análise
4. Se o ETag mudou — baixa e analisa a especificação atualizada, atualiza o cache

**Arquivos locais:**

1. Na primeira execução — calcula o hash SHA-256 do conteúdo do arquivo, salva junto com o IR
2. Nas execuções seguintes — compara o hash atual com o hash em cache
3. Se não mudou — usa o IR em cache, pulando a análise
4. Se mudou — analisa novamente e atualiza o cache

A geração dos arquivos a partir do IR (a etapa de escrita em disco) é sempre executada — o `cache` economiza apenas a requisição de rede e a análise da especificação.

## Localização do cache

```
.apig/
  cache/
    <key>.ir.json     — IR em cache
    <key>.meta.json   — ETag (para URL) ou hash da especificação (para arquivos locais)
```

`<key>` são os primeiros 16 caracteres do hash SHA-256 do valor de `input`.

Adicione ao `.gitignore` se não quiser fazer commit do cache:

```
.apig/cache/
```
