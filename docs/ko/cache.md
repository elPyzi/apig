# 캐시

`cache: true`이면 apig는 파싱된 IR(중간 표현)을 캐시하여, 사양이 변경되지 않은 경우 매 실행마다 다시 다운로드하고 파싱하지 않도록 합니다.

## 설정

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## 작동 방식

**원격 사양(URL 입력):**

1. 첫 번째 실행 — 사양을 다운로드하고 파싱한 뒤, IR과 ETag를 `.apig/cache/`에 저장
2. 이후 실행 — 캐시된 ETag가 포함된 `If-None-Match` 헤더 전송
3. 서버가 `304 Not Modified`를 반환하면 — 캐시된 IR을 사용하고, 재다운로드와 재파싱을 건너뜀
4. ETag가 변경되었으면 — 업데이트된 사양을 다운로드하고 파싱하여 캐시를 갱신

**로컬 파일 입력:**

1. 첫 번째 실행 — 파일 내용의 SHA-256 해시를 계산하여 IR과 함께 저장
2. 이후 실행 — 현재 파일 해시와 캐시된 해시 비교
3. 변경되지 않은 경우 — 캐시된 IR을 사용하고, 파싱을 건너뜀
4. 변경된 경우 — 다시 파싱하고 캐시를 갱신

IR로부터 파일을 생성하는 단계(디스크에 쓰는 작업)는 어느 경우든 수행됩니다 — `cache`가 절약하는 것은 사양의 네트워크 요청과 파싱뿐입니다.

## 캐시 위치

```
.apig/
  cache/
    <key>.ir.json     — 캐시된 IR
    <key>.meta.json   — ETag(URL의 경우) 또는 사양 해시(로컬 파일의 경우)
```

`<key>`는 `input` 값의 SHA-256 해시 앞 16자입니다.

캐시를 커밋하지 않으려면 `.gitignore`에 추가하세요:

```
.apig/cache/
```
