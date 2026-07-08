# Caché

Con `cache: true`, apig almacena en caché el IR (representación intermedia) ya analizado, para no tener que descargar y analizar de nuevo la especificación en cada ejecución si esta no ha cambiado.

## Configuración

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## Cómo funciona

**Especificaciones remotas (URL):**

1. En la primera ejecución — descarga y analiza la especificación, guarda el IR y el ETag en `.apig/cache/`
2. En las siguientes ejecuciones — envía el encabezado `If-None-Match` con el ETag almacenado en caché
3. Si el servidor devuelve `304 Not Modified` — usa el IR almacenado en caché, omitiendo la nueva descarga y el análisis
4. Si el ETag cambió — descarga y analiza la especificación actualizada, actualiza la caché

**Archivos locales:**

1. En la primera ejecución — calcula el hash SHA-256 del contenido del archivo, lo guarda junto con el IR
2. En las siguientes ejecuciones — compara el hash actual con el almacenado en caché
3. Si no ha cambiado — usa el IR almacenado en caché, omitiendo el análisis
4. Si ha cambiado — analiza de nuevo y actualiza la caché

La generación de archivos a partir del IR (el paso de escritura en disco) se ejecuta en cualquier caso — `cache` solo ahorra la solicitud de red y el análisis de la especificación.

## Ubicación de la caché

```
.apig/
  cache/
    <key>.ir.json     — IR almacenado en caché
    <key>.meta.json   — ETag (para URL) o hash de la especificación (para archivos locales)
```

`<key>` son los primeros 16 caracteres del hash SHA-256 del valor de `input`.

Añádelo a `.gitignore` si no quieres hacer commit de la caché:

```
.apig/cache/
```
