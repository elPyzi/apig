# Cache

Avec `cache: true`, apig met en cache l'IR (représentation intermédiaire) analysé, afin de ne pas retélécharger ni reparser la spécification à chaque exécution si elle n'a pas changé.

## Configuration

```ts
defineConfig({
  input: 'https://api.example.com/openapi.json',
  output: './src/api',
  cache: true,
  plugins: [typescript(), sdk()],
})
```

## Fonctionnement

**Spécifications distantes (URL) :**

1. Au premier lancement — télécharge et parse la spécification, sauvegarde l'IR et l'ETag dans `.apig/cache/`
2. Aux lancements suivants — envoie l'en-tête `If-None-Match` avec l'ETag mis en cache
3. Si le serveur renvoie `304 Not Modified` — utilise l'IR mis en cache, saute le nouveau téléchargement et le parsing
4. Si l'ETag a changé — télécharge et parse la spécification mise à jour, met à jour le cache

**Fichiers locaux :**

1. Au premier lancement — calcule le hash SHA-256 du contenu du fichier, le sauvegarde avec l'IR
2. Aux lancements suivants — compare le hash actuel avec celui mis en cache
3. S'il n'a pas changé — utilise l'IR mis en cache, saute le parsing
4. S'il a changé — reparse et met à jour le cache

La génération des fichiers à partir de l'IR (l'étape d'écriture sur disque) est exécutée dans tous les cas — `cache` économise uniquement la requête réseau et le parsing de la spécification.

## Emplacement du cache

```
.apig/
  cache/
    <key>.ir.json     — IR mis en cache
    <key>.meta.json   — ETag (pour une URL) ou hash de la spécification (pour un fichier local)
```

`<key>` — les 16 premiers caractères du hash SHA-256 de la valeur `input`.

Ajoute-le à `.gitignore` si tu ne veux pas committer le cache :

```
.apig/cache/
```
