import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  VersionStorage,
  formatDate,
  formatFolderDate,
} from '@services/versioning/storage';

const AT = new Date('2026-09-06T23:10:00');

const dirs: string[] = [];
const scratch = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'apig-versions-'));
  dirs.push(dir);
  return dir;
};

afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const save = (storage: VersionStorage, apiVersion: string, at = AT) => {
  const snapshotId = `api_v${apiVersion}-gen_v1`;
  return storage.save({
    snapshotId,
    metadata: {
      snapshotId,
      apiVersion,
      generation: 1,
      createdAt: at.toISOString(),
      alias: `gen1-${apiVersion}`,
      comment: 'test',
      specHash: 'hash',
      irVersion: 1,
    },
    ir: { operations: [], schemas: [] },
  });
};

describe('formatFolderDate', () => {
  test('carries the same instant as the display form', () => {
    expect(formatDate(AT)).toBe('06.09.2026 23:10');
    expect(formatFolderDate(AT)).toBe('06.09.2026 23-10');
  });

  test('holds no character a path cannot', () => {
    // Windows rejects a colon outright, so a snapshot directory named with the
    // display form could not be created there at all
    expect(formatFolderDate(AT)).not.toContain(':');
  });
});

describe('VersionStorage', () => {
  test('names the snapshot directory without a colon', () => {
    const root = scratch();
    save(new VersionStorage(root), '1.0.0');

    const [dir] = readdirSync(root);
    expect(dir).toBeDefined();
    expect(dir).not.toContain(':');
    expect(dir).toStartWith('api_v1.0.0-gen_v1 - ');
  });

  test('still reads a directory named the old way', () => {
    const root = scratch();
    const storage = new VersionStorage(root);
    save(storage, '1.0.0');

    // only the prefix before " - " is parsed, so the date form is free to change
    expect(storage.resolveId('api_v1.0.0-gen_v1')).toBe('api_v1.0.0-gen_v1');
  });

  test('counts generations within one API version', () => {
    const root = scratch();
    const storage = new VersionStorage(root);

    expect(storage.nextGeneration('1.0.0')).toBe(1);
    save(storage, '1.0.0');
    expect(storage.nextGeneration('1.0.0')).toBe(2);
    // a different version starts its own count
    expect(storage.nextGeneration('2.0.0')).toBe(1);
  });
});
