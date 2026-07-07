import { createHash } from 'crypto';
import { resolve } from 'path';
import type { IR, SnapshotMetadata, ApigConfig } from '@models';
import type { OpenAPIV3 } from 'openapi-types';
import { VersionStorage, IR_VERSION } from '@services/versioning/storage';
import { logger } from '@libs/logger';

const DEFAULT_COMMENT = 'travjek — generated snapshot comment';
const DEFAULT_STORAGE = '.apig/versions';

interface SaveSnapshotParams {
  ir: IR;
  spec: OpenAPIV3.Document;
  config: ApigConfig;
  comment?: string;
}

export const saveSnapshot = (params: SaveSnapshotParams): string => {
  const { ir, spec, config } = params;
  const versioning = config.versioning ?? {};

  const storagePath = resolve(versioning.storage ?? DEFAULT_STORAGE);
  const storage = new VersionStorage(storagePath);

  const rawVersion = spec.info?.version;
  if (!rawVersion) {
    logger.warn(
      `Spec has no info.version — snapshot will be stored as "unknown". ` +
        `Add version to your OpenAPI spec: info: { version: "1.0.0" }`,
    );
  }
  const apiVersion = String(rawVersion ?? 'unknown');
  const generation = storage.nextGeneration(apiVersion);
  const snapshotId = `api_v${apiVersion}-gen_v${generation}`;

  const specJson = JSON.stringify(spec);
  const specHash = createHash('sha256').update(specJson).digest('hex');

  const date = new Date().toISOString().slice(0, 10);
  const alias = (versioning.aliasTemplate ?? 'gen{generation}')
    .replace('{generation}', String(generation))
    .replace('{apiVersion}', apiVersion)
    .replace('{date}', date);

  const existingAliases = storage.listWithMeta().map((e) => e.alias);
  if (existingAliases.includes(alias)) {
    logger.warn(
      `Alias "${alias}" already exists in storage. ` +
        `Consider updating aliasTemplate to include {generation} or {date} to ensure uniqueness.`,
    );
  }

  const metadata: SnapshotMetadata = {
    snapshotId,
    apiVersion,
    generation,
    createdAt: new Date().toISOString(),
    alias,
    comment: params.comment ?? config.comment ?? DEFAULT_COMMENT,
    specHash,
    irVersion: IR_VERSION,
  };

  const folderName = storage.save({
    snapshotId,
    metadata,
    ir,
    spec: versioning.saveSpec ? spec : undefined,
  });

  if (versioning.maxSaves !== undefined) {
    const pinVersions = versioning.pinVersions ?? [];
    const allSnapshots = storage.list();

    if (pinVersions.length >= versioning.maxSaves && allSnapshots.length >= versioning.maxSaves) {
      throw new Error(
        `All ${versioning.maxSaves} pinned versions are protected — ` +
          `remove at least one entry from pinVersions or increase maxSaves to continue saving snapshots.`,
      );
    }

    storage.applyMaxSaves(versioning.maxSaves, pinVersions);
  }

  return folderName;
};
