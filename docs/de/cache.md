# Cache

Wenn `cache: true` gesetzt ist, cacht apig das geparste IR (die Zwischendarstellung), damit die Spezifikation bei unverändertem Inhalt nicht bei jedem Lauf erneut heruntergeladen und geparst werden muss.

## Konfiguration

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## Funktionsweise

**Remote-Spezifikationen (URL):**

1. Beim ersten Lauf — lädt die Spezifikation herunter und parst sie, speichert IR und ETag in `.apig/cache/`
2. Bei nachfolgenden Läufen — sendet den Header `If-None-Match` mit dem zwischengespeicherten ETag
3. Wenn der Server `304 Not Modified` zurückgibt — verwendet das zwischengespeicherte IR, überspringt erneutes Herunterladen und Parsen
4. Wenn sich das ETag geändert hat — lädt die aktualisierte Spezifikation herunter, parst sie und aktualisiert den Cache

**Lokale Dateien:**

1. Beim ersten Lauf — berechnet den SHA-256-Hash des Dateiinhalts, speichert ihn zusammen mit dem IR
2. Bei nachfolgenden Läufen — vergleicht den aktuellen Hash mit dem zwischengespeicherten Hash
3. Wenn unverändert — verwendet das zwischengespeicherte IR, überspringt das Parsen
4. Wenn geändert — parst neu und aktualisiert den Cache

Die Generierung der Dateien aus dem IR (der Schreibschritt auf die Festplatte) wird in jedem Fall ausgeführt — `cache` spart nur den Netzwerk-Request und das Parsen der Spezifikation.

## Speicherort des Caches

```
.apig/
  cache/
    <key>.ir.json     — zwischengespeichertes IR
    <key>.meta.json   — ETag (bei URL) oder Hash der Spezifikation (bei lokalen Dateien)
```

`<key>` sind die ersten 16 Zeichen des SHA-256-Hashes des `input`-Werts.

Füge es zu `.gitignore` hinzu, wenn du den Cache nicht committen möchtest:

```
.apig/cache/
```
