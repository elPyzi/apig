import type { GenerationStats, LogLevel } from '@models';
import { LOG_LEVELS } from '@models';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const c = (color: keyof typeof colors, text: string): string =>
  `${colors[color]}${text}${colors.reset}`;

class Logger {
  private level: LogLevel = LOG_LEVELS.MINIMAL;
  private warnBuffer: string[] = [];

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private isMinimal(): boolean {
    return this.level === LOG_LEVELS.MINIMAL;
  }

  private isDetailed(): boolean {
    return this.level === LOG_LEVELS.DETAILED;
  }

  error(message: string): void {
    console.error(`${c('red', '✗')} ${c('red', message)}`);
  }

  validationError(
    title: string,
    errors: string[],
    links: Record<string, string>,
  ): void {
    console.error(`${c('red', '✗')} ${c('red', title)}`);
    for (const err of errors) {
      console.error(`  ${c('red', `- ${err}`)}`);
    }
    console.error('');
    for (const [label, url] of Object.entries(links)) {
      console.error(`  ${c('gray', `${label}:`)}  ${c('cyan', url)}`);
    }
    console.error('');
  }

  success(message: string): void {
    console.log(`${c('green', '✓')} ${c('green', message)}`);
  }

  stage(message: string): void {
    if (this.isMinimal()) return;
    console.log(message);
  }

  plugin(name: string, message: string): void {
    if (this.isMinimal()) return;
    console.log(`${c('gray', `[${name}]`)} ${message}`);
  }

  detail(message: string): void {
    if (!this.isDetailed()) return;
    console.log(message);
  }

  warn(message: string): void {
    this.warnBuffer.push(message);
  }

  private flushWarnings(): void {
    for (const msg of this.warnBuffer) {
      console.log(`${c('yellow', '⚠')} ${c('yellow', msg)}`);
    }
    this.warnBuffer = [];
  }

  section(label: string, value: string): void {
    if (!this.isDetailed()) return;
    console.log(`${label}:`);
    console.log(`  ${value}`);
    console.log('');
  }

  info(message: string): void {
    this.stage(message);
  }

  title(message: string): void {
    console.log(`${c('cyan', '◆')} ${c('bold', message)}`);
  }

  hook(command: string): void {
    console.log(`${c('gray', '.:')  } Running hook: ${command}`);
  }

  debug(message: string): void {
    this.detail(message);
  }

  divider(): void {
    if (!this.isDetailed()) return;
    console.log(c('gray', '─'.repeat(24)));
  }

  br(): void {
    if (this.isMinimal()) return;
    console.log('');
  }

  summary(stats: GenerationStats): void {
    const duration = stats.endedAt - stats.startedAt;

    if (this.isMinimal()) {
      console.log(`${c('green', '✓')} ${c('green', `Generation completed`)} ${c('gray', `(${duration}ms)`)}`);
      this.flushWarnings();
    } else {
      console.log(c('gray', '─'.repeat(24)));
      console.log('');
      console.log(`Operations: ${stats.operations}`);
      console.log(`Schemas: ${stats.schemas}`);
      console.log('');
      console.log(`Files:`);
      console.log(`  Created: ${stats.createdFiles}`);
      console.log(`  Updated: ${stats.updatedFiles}`);
      console.log(`  Deleted: ${stats.deletedFiles}`);
      console.log('');
      console.log(`Duration: ${duration}ms`);
      console.log('');
      this.flushWarnings();
    }
  }
}

export const logger = new Logger();
