import { basename } from 'path';

import { toPascalCase } from '@libs/string';

/** One file as `@scalar/openapi-parser` loaded it. */
interface FsFile {
  filename: string | null;
  isEntrypoint?: boolean;
  specification: unknown;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const segments = (pointer: string): string[] =>
  pointer
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

const atPointer = (root: unknown, pointer: string): unknown =>
  segments(pointer).reduce<unknown>(
    (acc, key) => (isObj(acc) ? acc[key] : undefined),
    root,
  );

/**
 * Rewrites `$ref`s that point at another file into local ones.
 *
 * The parser hands back the entrypoint exactly as it was read, references and
 * all — apig resolves them itself, by the name the pointer ends in. That works
 * only for a target the document declares: `./common.json#/…/Pet` named a `Pet`
 * that lives in a file nobody ever looked at, so the generated code imported a
 * type that was never emitted. Every such target is copied into
 * `components.schemas` and the reference retargeted at the copy, which leaves
 * the rest of the pipeline seeing one self-contained document.
 */
export const bundleExternalRefs = (filesystem: FsFile[]): void => {
  const entry = filesystem.find((f) => f.isEntrypoint);
  if (!entry || !isObj(entry.specification)) return;

  const spec = entry.specification;
  // filename -> file, matched loosely: a neighbouring file is referenced the
  // same way from every document that sits beside it, but not always spelled
  // the same way (`./common.json`, `common.json`)
  const findFile = (name: string): FsFile | undefined =>
    filesystem.find((f) => f.filename === name) ??
    filesystem.find(
      (f) => f.filename && basename(f.filename) === basename(name),
    );

  const schemas = (): Obj => {
    const components = (spec.components ??= {}) as Obj;
    return (components.schemas ??= {}) as Obj;
  };

  // `file#pointer` -> the name it was hoisted under, so a target reached twice
  // is copied once and a cycle terminates. Keyed by base name because the same
  // file is listed once per spelling it was referenced by — `./shared.json`
  // from a sibling and `./models/shared.json` from the root are one file, and
  // hoisting both would declare the same schema twice under different names
  const keyOf = (file: FsFile, pointer: string) =>
    `${basename(file.filename ?? '')}#${pointer}`;
  const hoisted = new Map<string, string>();

  const uniqueName = (pointer: string, file: FsFile): string => {
    const last = segments(pointer).at(-1);
    const base =
      last ?? toPascalCase(basename(file.filename ?? 'external', '.json'));

    if (!(base in schemas()) && ![...hoisted.values()].includes(base)) {
      return base;
    }
    let n = 2;
    while (`${base}${n}` in schemas()) n++;
    return `${base}${n}`;
  };

  const hoist = (file: FsFile, pointer: string): string | null => {
    const key = keyOf(file, pointer);
    const seen = hoisted.get(key);
    if (seen) return seen;

    const target = pointer ? atPointer(file.specification, pointer) : undefined;
    if (!isObj(target)) return null;

    const name = uniqueName(pointer, file);
    // registered before the copy is walked: a schema that reaches itself would
    // otherwise be hoisted forever
    hoisted.set(key, name);

    const copy = structuredClone(target);
    schemas()[name] = copy;
    // resolved in the file it came from — a `#/…` inside it points there, not
    // at the entrypoint
    walk(copy, file);

    return name;
  };

  const walk = (node: unknown, file: FsFile): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item, file);
      return;
    }
    if (!isObj(node)) return;

    const ref = node.$ref;
    if (typeof ref === 'string') {
      const [prefix = '', pointer = ''] = ref.split('#', 2);
      const target = prefix ? findFile(prefix) : file;

      if (target && target !== entry) {
        const name = hoist(target, pointer);
        if (name) node.$ref = `#/components/schemas/${name}`;
      } else if (target === entry && prefix) {
        // an external file pointing back into the main document
        node.$ref = `#${pointer}`;
      }
    }

    for (const value of Object.values(node)) walk(value, file);
  };

  walk(spec, entry);
};
