# CLI

## Comandos

### `apig generate` (alias `g`)

Ejecuta la generación de código.

```bash
apig generate
```

**Flags:**

| Flag | Descripción |
|------|-------------|
| `-c, --config <ruta>` | Ruta al archivo de configuración (por defecto `apig.config.ts`) |
| `-d, --dry-run` | Vista previa sin escribir archivos |
| `-w, --watch` | Vigilar cambios en la especificación y en la configuración |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

Con `--watch`, para especificaciones en archivos locales se vigilan los cambios tanto de la configuración como del propio archivo de especificación. Para especificaciones por URL, la vigilancia del archivo no es compatible — solo la de la configuración.

---

### `apig start` (alias `s`)

Asistente de configuración interactivo — selección de plugins y opciones de salida mediante preguntas de diálogo en la terminal.

```bash
apig start
```

---

### `apig config` (alias `c`)

Crea un archivo `apig.config.ts` en el directorio actual. El comando **no** muestra la configuración actual — genera un nuevo archivo de plantilla.

```bash
apig config
```

Si ya existe `apig.config.ts`, el comando terminará con un error.

**Flags:**

| Flag | Descripción |
|------|-------------|
| `-p, --preset <name>` | Usar uno de los presets predefinidos |
| `--list-presets` | Mostrar la lista de presets disponibles y salir |

```bash
apig config --list-presets
apig config --preset react
```

**Presets disponibles:**

| Preset | Descripción |
|--------|-------------|
| `minimal` | Tipos TypeScript + funciones SDK con fetch |
| `react` | TypeScript + SDK + TanStack Query + Zod (stack estándar de React) |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | Stack de React + fábricas Faker + manejadores MSW para mocking |
| `forms` | TypeScript + SDK + Zod + resolvers de React Hook Form |
| `full` | Todos los plugins a la vez |

---

### `apig info` (alias `i`)

Muestra estadísticas de la especificación cargada sin generar archivos: nombre y versión de la API, ruta de entrada/salida, `groupBy`, número de operaciones (desglosado por métodos), número de esquemas, lista de tags, plugins conectados.

```bash
apig info
```

**Flags:**

| Flag | Descripción |
|------|-------------|
| `-c, --config <ruta>` | Ruta al archivo de configuración (por defecto `apig.config.ts`) |

---

### `apig versions`

Lista todos los snapshots guardados (requiere tener `versioning.enabled` activado en la configuración).

```bash
apig versions
```

**Flags:**

| Flag | Descripción |
|------|-------------|
| `-c, --config <ruta>` | Ruta al archivo de configuración |
| `-s, --storage <ruta>` | Directorio de almacenamiento de snapshots (sobrescribe la configuración) |

Columnas: alias, ID del snapshot, fecha de creación.

---

### `apig version checkout <id|alias>`

Regenera el código a partir de un snapshot guardado.

```bash
apig version checkout abc123
apig version checkout gen5
```

**Flags:** `-c, --config <ruta>`, `--dry-run`

---

### `apig version show <id|alias>`

Información detallada de un snapshot: alias, ID, versión de la API, número de generación, fecha de creación, comentario, presencia de la especificación guardada.

```bash
apig version show abc123
```

**Flags:** `-c, --config <ruta>`, `-s, --storage <ruta>`

---

## Ruta de configuración personalizada

Por defecto, apig busca `apig.config.ts` en el directorio actual. Usa `-c` para indicar un archivo diferente:

```bash
apig generate -c ./config/apig.config.ts
```
