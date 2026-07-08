# CLI

## Befehle

### `apig generate` (Alias `g`)

Führt die Code-Generierung aus.

```bash
apig generate
```

**Flags:**

| Flag | Beschreibung |
|------|--------------|
| `-c, --config <pfad>` | Pfad zur Konfigurationsdatei (Standard: `apig.config.ts`) |
| `-d, --dry-run` | Vorschau anzeigen, ohne Dateien zu schreiben |
| `-w, --watch` | Überwacht Änderungen an Spezifikation und Konfiguration |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

Bei `--watch` werden für lokale Spezifikationsdateien sowohl Änderungen an der Konfiguration als auch an der Spezifikationsdatei selbst überwacht. Bei Spezifikationen per URL wird die Dateiüberwachung nicht unterstützt — nur die Konfiguration.

---

### `apig start` (Alias `s`)

Interaktiver Einrichtungsassistent — Auswahl von Plugins und Ausgabeoptionen über Dialogfragen im Terminal.

```bash
apig start
```

---

### `apig config` (Alias `c`)

Erstellt eine Datei `apig.config.ts` im aktuellen Verzeichnis. Der Befehl gibt **nicht** die aktuelle Konfiguration aus — er generiert eine neue Vorlagendatei.

```bash
apig config
```

Wenn `apig.config.ts` bereits existiert, bricht der Befehl mit einem Fehler ab.

**Flags:**

| Flag | Beschreibung |
|------|--------------|
| `-p, --preset <name>` | Eines der vorgefertigten Presets verwenden |
| `--list-presets` | Liste der verfügbaren Presets anzeigen und beenden |

```bash
apig config --list-presets
apig config --preset react
```

**Verfügbare Presets:**

| Preset | Beschreibung |
|--------|--------------|
| `minimal` | TypeScript-Typen + SDK-fetch-Funktionen |
| `react` | TypeScript + SDK + TanStack Query + Zod (typischer React-Stack) |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | React-Stack + Faker-Factories + MSW-Handler zum Mocken |
| `forms` | TypeScript + SDK + Zod + React-Hook-Form-Resolver |
| `full` | Alle Plugins auf einmal |

---

### `apig info` (Alias `i`)

Zeigt Statistiken zur geladenen Spezifikation an, ohne Dateien zu generieren: Titel und Version der API, Eingabe-/Ausgabepfad, `groupBy`, Anzahl der Operationen (aufgeschlüsselt nach Methoden), Anzahl der Schemata, Liste der Tags, verwendete Plugins.

```bash
apig info
```

**Flags:**

| Flag | Beschreibung |
|------|--------------|
| `-c, --config <pfad>` | Pfad zur Konfigurationsdatei (Standard: `apig.config.ts`) |

---

### `apig versions`

Listet alle gespeicherten Snapshots auf (erfordert aktiviertes `versioning.enabled` in der Konfiguration).

```bash
apig versions
```

**Flags:**

| Flag | Beschreibung |
|------|--------------|
| `-c, --config <pfad>` | Pfad zur Konfigurationsdatei |
| `-s, --storage <pfad>` | Speicherverzeichnis für Snapshots (überschreibt die Konfiguration) |

Spalten: Alias, Snapshot-ID, Erstellungsdatum.

---

### `apig version checkout <id|alias>`

Regeneriert Code aus einem gespeicherten Snapshot.

```bash
apig version checkout abc123
apig version checkout gen5
```

**Flags:** `-c, --config <pfad>`, `--dry-run`

---

### `apig version show <id|alias>`

Ausführliche Informationen zu einem Snapshot: Alias, ID, API-Version, Generierungsnummer, Erstellungsdatum, Kommentar, ob eine Spezifikation gespeichert wurde.

```bash
apig version show abc123
```

**Flags:** `-c, --config <pfad>`, `-s, --storage <pfad>`

---

## Benutzerdefinierter Konfigurationspfad

Standardmäßig sucht apig im aktuellen Verzeichnis nach `apig.config.ts`. Verwende `-c`, um eine andere Datei anzugeben:

```bash
apig generate -c ./config/apig.config.ts
```
