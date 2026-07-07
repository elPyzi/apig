import { GROUP_BY, type ApigConfig } from '@models';

type ValidationPlugin = 'zod' | 'valibot' | 'yup';

const VALIDATION_PLUGINS: ValidationPlugin[] = ['zod', 'valibot', 'yup'];

const getValidationPath = (config: ApigConfig, plugin: string): string => {
  const groupBy = config?.groupBy ?? GROUP_BY.NONE;

  switch (groupBy) {
    case GROUP_BY.TAGS:
    case GROUP_BY.OPERATIONS:
      return `../${plugin}`;
    case GROUP_BY.ENDPOINTS:
      return `../../${plugin}`;
    default:
      return `./${plugin}`;
  }
};

const getValidationPlugin = (
  config: ApigConfig,
): ValidationPlugin | 'types' => {
  const plugins = config.plugins ?? [];

  for (const p of plugins) {
    const name = typeof p === 'string' ? p : p.name;
    if (VALIDATION_PLUGINS.includes(name as ValidationPlugin)) {
      return name as ValidationPlugin;
    }
  }

  return 'types';
};

export const getTypesImport = (config: ApigConfig): string => {
  const plugin = getValidationPlugin(config);

  return getValidationPath(config, plugin);
};
