import { load, dereference } from '@scalar/openapi-parser';
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls';
import { readFiles } from '@scalar/openapi-parser/plugins/read-files';
import { upgrade } from '@scalar/openapi-upgrader';
import type { OpenAPIV3 } from 'openapi-types';
import { logger } from '@libs/logger';
import type { ApigConfig, LoadSpecResult } from '@models';

const isSwagger2 = (spec: Record<string, unknown>): boolean =>
  typeof spec.swagger === 'string' && spec.swagger.startsWith('2.');

const convertToV3 = (spec: Record<string, unknown>): Record<string, unknown> =>
  upgrade(spec, '3.0') as Record<string, unknown>;

export const loadSpecFromText = async (text: string, config: ApigConfig): Promise<LoadSpecResult> => {
  const loaded = await load(text, { plugins: [fetchUrls(), readFiles()] });

  if (loaded.errors?.length) {
    throw new Error(`Failed to load specification: ${loaded.errors.map((e) => e.message).join(', ')}`);
  }

  let filesystem = loaded.filesystem;

  const raw = loaded.specification as Record<string, unknown>;
  if (isSwagger2(raw)) {
    const converted = convertToV3(raw);
    const reloaded = await load(JSON.stringify(converted));
    filesystem = reloaded.filesystem;
  }

  const { specification, errors } = dereference(filesystem);

  if (errors?.length) {
    logger.warn(`${errors.length} unresolvable $ref(s) in specification — affected fields will be typed as unknown`);
  }

  const spec = specification as unknown as OpenAPIV3.Document;

  const schemaNames = new Map<object, string>();
  for (const [name, s] of Object.entries(spec.components?.schemas ?? {})) {
    schemaNames.set(s as object, name);
  }

  return { spec, schemaNames };
};

export const loadSpec = async (config: ApigConfig): Promise<LoadSpecResult> => {
  const input =
    typeof config.input === 'function' ? await config.input() : config.input;

  const loaded = await load(input, { plugins: [fetchUrls(), readFiles()] });

  if (loaded.errors?.length) {
    throw new Error(`Failed to load specification: ${loaded.errors.map((e) => e.message).join(', ')}`);
  }

  let filesystem = loaded.filesystem;

  const raw = loaded.specification as Record<string, unknown>;
  if (isSwagger2(raw)) {
    const converted = convertToV3(raw);
    const reloaded = await load(JSON.stringify(converted));
    filesystem = reloaded.filesystem;
  }

  const { specification, errors } = dereference(filesystem);

  if (errors?.length) {
    logger.warn(`${errors.length} unresolvable $ref(s) in specification — affected fields will be typed as unknown`);
  }

  const spec = specification as unknown as OpenAPIV3.Document;

  const schemaNames = new Map<object, string>();
  for (const [name, s] of Object.entries(spec.components?.schemas ?? {})) {
    schemaNames.set(s as object, name);
  }

  return { spec, schemaNames };
};
