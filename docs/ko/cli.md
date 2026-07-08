# CLI

## 명령어

### `apig generate` (별칭 `g`)

코드 생성을 실행합니다.

```bash
apig generate
```

**플래그:**

| 플래그 | 설명 |
|--------|------|
| `-c, --config <경로>` | 설정 파일 경로 (기본값 `apig.config.ts`) |
| `-d, --dry-run` | 파일을 작성하지 않고 미리보기 |
| `-w, --watch` | 사양 및 설정 변경 감시 |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

`--watch`를 사용하면 로컬 사양 파일의 경우 설정 파일과 사양 파일 둘 다 감시합니다. URL로 지정된 사양의 경우 파일 감시는 지원되지 않으며 — 설정 파일만 감시합니다.

---

### `apig start` (별칭 `s`)

터미널에서 대화형 질문을 통해 플러그인과 출력 옵션을 선택하는 대화형 설정 마법사입니다.

```bash
apig start
```

---

### `apig config` (별칭 `c`)

현재 디렉터리에 `apig.config.ts` 파일을 생성합니다. 이 명령은 현재 설정을 출력하지 **않습니다** — 새 설정 파일 초안을 생성합니다.

```bash
apig config
```

`apig.config.ts`가 이미 존재하면 명령이 오류와 함께 종료됩니다.

**플래그:**

| 플래그 | 설명 |
|--------|------|
| `-p, --preset <name>` | 미리 준비된 프리셋 중 하나를 사용 |
| `--list-presets` | 사용 가능한 프리셋 목록을 표시하고 종료 |

```bash
apig config --list-presets
apig config --preset react
```

**사용 가능한 프리셋:**

| 프리셋 | 설명 |
|--------|------|
| `minimal` | TypeScript 타입 + SDK fetch 함수 |
| `react` | TypeScript + SDK + TanStack Query + Zod (표준 React 스택) |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | React 스택 + Faker 팩토리 + 목킹용 MSW 핸들러 |
| `forms` | TypeScript + SDK + Zod + React Hook Form 리졸버 |
| `full` | 모든 플러그인 한 번에 |

---

### `apig info` (별칭 `i`)

파일을 생성하지 않고 로드된 사양에 대한 통계를 표시합니다: API 이름과 버전, 입력/출력 경로, `groupBy`, 작업 수(메서드별 분류 포함), 스키마 수, 태그 목록, 연결된 플러그인.

```bash
apig info
```

**플래그:**

| 플래그 | 설명 |
|--------|------|
| `-c, --config <경로>` | 설정 파일 경로 (기본값 `apig.config.ts`) |

---

### `apig versions`

저장된 모든 스냅샷 목록을 표시합니다(설정에서 `versioning.enabled`가 활성화되어 있어야 함).

```bash
apig versions
```

**플래그:**

| 플래그 | 설명 |
|--------|------|
| `-c, --config <경로>` | 설정 파일 경로 |
| `-s, --storage <경로>` | 스냅샷 저장소 디렉터리 (설정을 재정의) |

출력 열: 별칭, 스냅샷 ID, 생성 날짜.

---

### `apig version checkout <id|alias>`

저장된 스냅샷에서 코드를 재생성합니다.

```bash
apig version checkout abc123
apig version checkout gen5
```

**플래그:** `-c, --config <경로>`, `--dry-run`

---

### `apig version show <id|alias>`

스냅샷에 대한 상세 정보: 별칭, ID, API 버전, 생성 번호, 생성 날짜, 코멘트, 저장된 사양 존재 여부.

```bash
apig version show abc123
```

**플래그:** `-c, --config <경로>`, `-s, --storage <경로>`

---

## 사용자 지정 설정 경로

기본적으로 apig는 현재 디렉터리에서 `apig.config.ts`를 찾습니다. `-c`를 사용하여 다른 파일을 지정하세요:

```bash
apig generate -c ./config/apig.config.ts
```
