import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
} from 'fs';
import { join, resolve } from 'path';
import type { SnapshotMetadata } from '@models';
import type { IR } from '@models';
import type { OpenAPIV3 } from 'openapi-types';

const IR_VERSION = 1;

const SNAPSHOT_RE = /^(api_v(.+?)-gen_v(\d+)) - /;

interface ParsedFolder {
  snapshotId: string;
  apiVersion: string;
  generation: number;
  folderName: string;
}

const parseFolder = (name: string): ParsedFolder | null => {
  const m = name.match(SNAPSHOT_RE);
  if (!m) return null;
  return {
    snapshotId: m[1],
    apiVersion: m[2],
    generation: parseInt(m[3], 10),
    folderName: name,
  };
};

export class VersionStorage {
  private readonly root: string;

  constructor(storagePath: string) {
    this.root = resolve(storagePath);
  }

  private ensureRoot(): void {
    mkdirSync(this.root, { recursive: true });
  }

  private listParsed(): ParsedFolder[] {
    if (!existsSync(this.root)) return [];
    return readdirSync(this.root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => parseFolder(d.name))
      .filter((p): p is ParsedFolder => p !== null);
  }

  nextGeneration(apiVersion: string): number {
    const existing = this.listParsed().filter(
      (p) => p.apiVersion === apiVersion,
    );
    if (existing.length === 0) return 1;
    return Math.max(...existing.map((p) => p.generation)) + 1;
  }

  save(params: {
    snapshotId: string;
    metadata: SnapshotMetadata;
    ir: IR;
    spec?: OpenAPIV3.Document;
  }): string {
    this.ensureRoot();

    const date = new Date(params.metadata.createdAt);
    const dateStr = formatDate(date);
    const folderName = `${params.snapshotId} - ${dateStr}`;
    const dir = join(this.root, folderName);

    mkdirSync(dir, { recursive: true });

    writeFileSync(
      join(dir, 'ir.json'),
      JSON.stringify(params.ir, null, 2),
      'utf-8',
    );
    writeFileSync(
      join(dir, 'metadata.json'),
      JSON.stringify(params.metadata, null, 2),
      'utf-8',
    );

    if (params.spec) {
      writeFileSync(
        join(dir, 'spec.json'),
        JSON.stringify(params.spec, null, 2),
        'utf-8',
      );
    }

    return folderName;
  }

  applyMaxSaves(maxSaves: number, pinVersions: string[] = []): void {
    const all = this.listParsed();
    if (all.length <= maxSaves) return;

    const pinSet = new Set(pinVersions);
    const pinned = all.filter((p) => pinSet.has(p.snapshotId));
    const unpinned = all.filter((p) => !pinSet.has(p.snapshotId));

    const freeSlots = maxSaves - pinned.length;
    if (freeSlots <= 0) return;

    const withDates = unpinned.map((p) => {
      const metaPath = join(this.root, p.folderName, 'metadata.json');
      let createdAt = '';
      try {
        const meta = JSON.parse(
          readFileSync(metaPath, 'utf-8'),
        ) as SnapshotMetadata;
        createdAt = meta.createdAt;
      } catch (_) {
        // If metadata is unreadable, treat as oldest
      }
      return { ...p, createdAt };
    });

    withDates.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const toRemove = withDates.slice(0, withDates.length - freeSlots);
    for (const entry of toRemove) {
      rmSync(join(this.root, entry.folderName), { recursive: true });
    }
  }

  list(): string[] {
    return this.listWithMeta().map((e) => e.id);
  }

  listWithMeta(pinVersions: string[] = []): Array<{ id: string; alias: string; createdAt: string; pinned: boolean }> {
    const pinSet = new Set(pinVersions);
    return this.listParsed()
      .sort((a, b) => {
        const vCmp = a.apiVersion.localeCompare(b.apiVersion, undefined, {
          numeric: true,
        });
        if (vCmp !== 0) return vCmp;
        return a.generation - b.generation;
      })
      .map((p) => {
        let createdAt = '';
        let alias = `gen${p.generation}`;
        try {
          const meta = JSON.parse(
            readFileSync(join(this.root, p.folderName, 'metadata.json'), 'utf-8'),
          ) as SnapshotMetadata;
          createdAt = formatDate(new Date(meta.createdAt));
          if (meta.alias) alias = meta.alias;
        } catch (_) {}
        return { id: p.snapshotId, alias, createdAt, pinned: pinSet.has(p.snapshotId) };
      });
  }

  loadIR(snapshotId: string): IR {
    const folder = this.findFolder(snapshotId);
    return JSON.parse(
      readFileSync(join(this.root, folder, 'ir.json'), 'utf-8'),
    ) as IR;
  }

  loadSpec(snapshotId: string): OpenAPIV3.Document | null {
    const folder = this.findFolder(snapshotId);
    const path = join(this.root, folder, 'spec.json');
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as OpenAPIV3.Document;
  }

  loadMetadata(snapshotId: string): SnapshotMetadata {
    const folder = this.findFolder(snapshotId);
    return JSON.parse(
      readFileSync(join(this.root, folder, 'metadata.json'), 'utf-8'),
    ) as SnapshotMetadata;
  }

  remove(snapshotId: string): void {
    const folder = this.findFolder(snapshotId);
    rmSync(join(this.root, folder), { recursive: true });
  }

  resolveId(idOrAlias: string): string {
    const all = this.listParsed();
    // Direct snapshotId match
    if (all.some((p) => p.snapshotId === idOrAlias)) return idOrAlias;
    // Alias lookup — collect all matches to detect conflicts
    const matches: string[] = [];
    for (const p of all) {
      try {
        const meta = JSON.parse(
          readFileSync(join(this.root, p.folderName, 'metadata.json'), 'utf-8'),
        ) as SnapshotMetadata;
        if (meta.alias === idOrAlias) matches.push(p.snapshotId);
      } catch (_) {}
    }
    if (matches.length === 1) return matches[0]!;
    if (matches.length > 1) {
      throw new Error(
        `Alias "${idOrAlias}" is ambiguous — it matches multiple snapshots:\n` +
          matches.map((id) => `  • ${id}`).join('\n') +
          `\nUse the full snapshot ID instead.`,
      );
    }
    throw new Error(`Snapshot not found: "${idOrAlias}"`);
  }

  private findFolder(snapshotId: string): string {
    if (!existsSync(this.root)) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }
    const entries = readdirSync(this.root, { withFileTypes: true }).filter(
      (d) => d.isDirectory(),
    );
    const match = entries.find((d) => d.name.startsWith(`${snapshotId} - `));
    if (!match) throw new Error(`Snapshot not found: ${snapshotId}`);
    return match.name;
  }
}

export const formatDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${MM}.${yyyy} ${HH}:${mm}`;
};

export { IR_VERSION };
