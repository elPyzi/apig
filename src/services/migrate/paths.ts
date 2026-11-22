import { isAbsolute, relative, resolve, sep } from 'path';
import type { MigratedProject } from './types';

export const isUrl = (value: string): boolean => /^https?:\/\//.test(value);

/**
 * Re-expresses a path written relative to the source config's directory as one
 * relative to the current directory, where `apig.config.ts` is written.
 */
export const rebasePath = (value: string, fromDir: string): string => {
  if (isUrl(value)) return value;
  const absolute = isAbsolute(value) ? value : resolve(fromDir, value);
  const rel = relative(process.cwd(), absolute).split(sep).join('/');
  if (rel === '') return '.';
  return rel.startsWith('.') ? rel : `./${rel}`;
};

/**
 * Projects that wrote different files into one directory cannot share it under
 * apig, where a directory is one project's output and `clean` empties it. Each
 * of them moves into its own subdirectory — all of them, since leaving one at
 * the shared path would have it clean out the others nested inside.
 */
export const dedupeOutputPaths = (projects: MigratedProject[]): void => {
  const byPath = new Map<string, MigratedProject[]>();
  for (const project of projects) {
    const group = byPath.get(project.output.path) ?? [];
    group.push(project);
    byPath.set(project.output.path, group);
  }

  for (const [original, group] of byPath) {
    if (group.length < 2) continue;
    const used = new Set<string>();
    group.forEach((project, i) => {
      const base = `${original.replace(/\/$/, '')}/${project.name ?? `project-${i + 1}`}`;
      let path = base;
      for (let n = 2; used.has(path); n++) path = `${base}-${n}`;
      used.add(path);
      project.output.path = path;
      project.notes.push(
        `output moved from ${original} to ${path} — ${group.length} projects wrote to ${original}`,
      );
    });
  }
};
