# CLI

## Commandes

### `apig generate` (alias `g`)

Lance la génération de code.

```bash
apig generate
```

**Options :**

| Option | Description |
|--------|-------------|
| `-c, --config <chemin>` | Chemin vers le fichier de configuration (par défaut `apig.config.ts`) |
| `-d, --dry-run` | Aperçu sans écriture de fichiers |
| `-w, --watch` | Surveillance des changements de la spécification et de la configuration |

```bash
apig generate --dry-run
apig generate --watch
apig generate -c ./config/apig.config.ts
```

Avec `--watch`, pour les fichiers de spécification locaux, les changements de la configuration et du fichier de spécification lui-même sont surveillés. Pour les spécifications par URL, la surveillance du fichier n'est pas prise en charge — uniquement celle de la configuration.

---

### `apig start` (alias `s`)

Assistant de configuration interactif — sélection des plugins et des paramètres de sortie via des questions dans le terminal.

```bash
apig start
```

---

### `apig config` (alias `c`)

Crée un fichier `apig.config.ts` dans le répertoire actuel. La commande **n'affiche pas** la configuration actuelle — elle génère un nouveau fichier gabarit.

```bash
apig config
```

Si `apig.config.ts` existe déjà, la commande échoue avec une erreur.

**Options :**

| Option | Description |
|--------|-------------|
| `-p, --preset <name>` | Utiliser l'un des préréglages disponibles |
| `--list-presets` | Afficher la liste des préréglages disponibles et quitter |

```bash
apig config --list-presets
apig config --preset react
```

**Préréglages disponibles :**

| Préréglage | Description |
|------------|-------------|
| `minimal` | Types TypeScript + fonctions SDK fetch |
| `react` | TypeScript + SDK + TanStack Query + Zod (stack React standard) |
| `react-swr` | TypeScript + SDK + SWR + Zod |
| `testing` | Stack React + fabriques Faker + gestionnaires MSW pour le mocking |
| `forms` | TypeScript + SDK + Zod + résolveurs React Hook Form |
| `full` | Tous les plugins à la fois |

---

### `apig info` (alias `i`)

Affiche des statistiques sur la spécification chargée, sans génération de fichiers : nom et version de l'API, chemin d'entrée/sortie, `groupBy`, nombre d'opérations (réparties par méthode), nombre de schémas, liste des tags, plugins configurés.

```bash
apig info
```

**Options :**

| Option | Description |
|--------|-------------|
| `-c, --config <chemin>` | Chemin vers le fichier de configuration (par défaut `apig.config.ts`) |

---

### `apig versions`

Liste tous les snapshots sauvegardés (nécessite `versioning.enabled` activé dans la configuration).

```bash
apig versions
```

**Options :**

| Option | Description |
|--------|-------------|
| `-c, --config <chemin>` | Chemin vers le fichier de configuration |
| `-s, --storage <chemin>` | Répertoire de stockage des snapshots (remplace la configuration) |

Colonnes : alias, ID du snapshot, date de création.

---

### `apig version checkout <id|alias>`

Régénère le code à partir d'un snapshot sauvegardé.

```bash
apig version checkout abc123
apig version checkout gen5
```

**Options :** `-c, --config <chemin>`, `--dry-run`

---

### `apig version show <id|alias>`

Informations détaillées sur un snapshot : alias, ID, version de l'API, numéro de génération, date de création, commentaire, présence d'une spécification sauvegardée.

```bash
apig version show abc123
```

**Options :** `-c, --config <chemin>`, `-s, --storage <chemin>`

---

## Chemin de configuration personnalisé

Par défaut, apig recherche `apig.config.ts` dans le répertoire actuel. Utilise `-c` pour indiquer un autre fichier :

```bash
apig generate -c ./config/apig.config.ts
```
