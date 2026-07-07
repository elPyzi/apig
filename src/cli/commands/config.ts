import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { Command } from 'commander';

import { logger } from '@libs/logger';
import { PRESETS, PRESET_NAMES } from '../presets';

const CONFIG_TEMPLATE = `// @travjek/apig — https://travjek.dev/docs
import { defineConfig, typescript, sdk, tanstackQuery } from '@travjek/apig';

export default defineConfig({
  input: 'https://api.example.com/openapi.json',

  output: {
    path: 'src/api/generated',
    clean: true,
  },

  baseUrl: 'https://api.example.com',

  plugins: [
    typescript(),
    sdk(),
    tanstackQuery(),
  ],

  groupBy: 'none',
  enumStyle: 'const',
  typeStyle: 'type',
  fileNaming: 'kebab-case',
  index: true,
});
`;

export const registerConfigCommand = (program: Command): void => {
  program
    .command('config')
    .alias('c')
    .description('Create apig.config.ts in the current directory')
    .option('-p, --preset <name>', `Preset to use: ${PRESET_NAMES.join(', ')}`)
    .option('--list-presets', 'List available presets and exit')
    .action((options) => {
      if (options.listPresets) {
        const divider = '─'.repeat(72);
        console.log('');
        console.log(divider);
        for (const [name, preset] of Object.entries(PRESETS)) {
          console.log(`  ${name.padEnd(14)} ${preset.description}`);
        }
        console.log(divider);
        console.log('');
        return;
      }

      const configPath = join(process.cwd(), 'apig.config.ts');

      if (existsSync(configPath)) {
        logger.error('apig.config.ts already exists');
        process.exit(1);
      }

      let template = CONFIG_TEMPLATE;
      if (options.preset) {
        const preset = PRESETS[options.preset as string];
        if (!preset) {
          logger.error(
            `Unknown preset "${options.preset}". Available: ${PRESET_NAMES.join(', ')}`,
          );
          process.exit(1);
        }
        template = preset.template;
      }

      writeFileSync(configPath, template, 'utf-8');

      const label = options.preset ? ` (preset: ${options.preset})` : '';
      logger.success(`Created apig.config.ts${label}`);
      logger.info('Edit the file and run: apig generate');
      logger.info('Or run: apig start  — for interactive setup');
    });
};
