#!/usr/bin/env node
import { createRequire } from 'module';
import { Command } from 'commander';

import { registerGenerateCommand } from './commands/generate';
import { toMessage } from '@libs/error';
import { registerInfoCommand } from './commands/info';
import { registerConfigCommand } from './commands/config';
import { registerVersionsCommands } from './commands/versions';
import { runStart } from './start';
import { logger } from '@libs/logger';

const VERSION = '0.0.1';

const program = new Command();

program
  .name('apig')
  .description('@travjek/apig — OpenAPI code generator')
  .version(VERSION)
  .addHelpCommand('help', 'Display help for a command');

registerGenerateCommand(program);
registerInfoCommand(program);
registerConfigCommand(program);
registerVersionsCommands(program);

program
  .command('start')
  .alias('s')
  .description('Interactive setup wizard — select plugins and configure output')
  .action(async () => {
    try {
      await runStart();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ExitPromptError') {
        console.log('\n  Aborted.\n');
        process.exit(0);
      }
      logger.error(toMessage(err));
      process.exit(1);
    }
  });

program.parse();
