# 缓存

当设置 `cache: true` 时，apig 会缓存已解析的 IR（中间表示），这样在规范未发生变化的情况下，每次运行都无需重新下载和解析规范。

## 配置

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## 工作原理

**远程规范（URL）：**

1. 首次运行——下载并解析规范，将 IR 和 ETag 保存到 `.apig/cache/`
2. 后续运行——发送带有缓存 ETag 的 `If-None-Match` 头
3. 如果服务器返回 `304 Not Modified`——使用缓存的 IR，跳过重新下载和解析
4. 如果 ETag 发生变化——下载并解析更新后的规范，更新缓存

**本地文件：**

1. 首次运行——计算文件内容的 SHA-256 哈希，与 IR 一起保存
2. 后续运行——将当前哈希与缓存的哈希进行比较
3. 如果未更改——使用缓存的 IR，跳过解析
4. 如果已更改——重新解析并更新缓存

无论哪种情况，从 IR 生成文件（写入磁盘这一步）都会照常执行——`cache` 只节省网络请求和规范解析的开销。

## 缓存位置

```
.apig/
  cache/
    <key>.ir.json     — 缓存的 IR
    <key>.meta.json   — ETag（用于 URL）或规范哈希（用于本地文件）
```

`<key>` 是 `input` 值的 SHA-256 哈希的前 16 个字符。

如果不想提交缓存，请将其添加到 `.gitignore`：

```
.apig/cache/
```
