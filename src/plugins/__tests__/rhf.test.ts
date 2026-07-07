import { describe, test, expect } from 'bun:test';
import { rhf, generateRhf } from '../rhf';
import { baseConfig, emptyIR, makeSchema, makeIR } from './fixtures';

const zodOpts = {
  resolver: 'zod' as const,
  schemaSuffix: 'Schema',
  schemasImportPath: './zod',
};
const valibotOpts = {
  resolver: 'valibot' as const,
  schemaSuffix: 'Schema',
  schemasImportPath: './valibot',
};
const yupOpts = {
  resolver: 'yup' as const,
  schemaSuffix: 'Schema',
  schemasImportPath: './yup',
};

describe('rhf', () => {
  describe('фабрика', () => {
    test('возвращает плагин с правильными мета', () => {
      const plugin = rhf({ resolver: 'zod' });
      expect(plugin.name).toBe('rhf');
      expect(plugin.fileName).toBe('rhf');
      expect(plugin.scope).toBe('root');
    });

    test('schemaSuffix по умолчанию Schema', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = rhf({ resolver: 'zod' }).generate!(ir, baseConfig);
      expect(result.code).toContain('UserSchema');
    });

    test("schemasImportPath по умолчанию './zod' для zod", () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = rhf({ resolver: 'zod' }).generate!(ir, baseConfig);
      expect(result.code).toContain("from './zod'");
    });
  });

  describe('пустой IR', () => {
    test('содержит banner', () => {
      const result = generateRhf(emptyIR, baseConfig, zodOpts);
      expect(result.code).toContain('auto-generated');
    });

    test('exports пустой при отсутствии схем', () => {
      const result = generateRhf(emptyIR, baseConfig, zodOpts);
      expect(result.exports).toEqual([]);
    });

    test('typeExports всегда пустой', () => {
      expect(generateRhf(emptyIR, baseConfig, zodOpts).typeExports).toEqual([]);
    });
  });

  describe('resolver: zod', () => {
    test('импортирует zodResolver из @hookform/resolvers/zod', () => {
      const result = generateRhf(emptyIR, baseConfig, zodOpts);
      expect(result.code).toContain('zodResolver');
      expect(result.code).toContain('@hookform/resolvers/zod');
    });

    test('генерирует resolver для схемы', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = generateRhf(ir, baseConfig, zodOpts);
      expect(result.code).toContain('userResolver = zodResolver(UserSchema)');
    });

    test('экспортирует resolver', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateRhf(ir, baseConfig, zodOpts).exports).toContain(
        'userResolver',
      );
    });
  });

  describe('resolver: valibot', () => {
    test('импортирует valibotResolver из @hookform/resolvers/valibot', () => {
      const result = generateRhf(emptyIR, baseConfig, valibotOpts);
      expect(result.code).toContain('valibotResolver');
      expect(result.code).toContain('@hookform/resolvers/valibot');
    });

    test('генерирует resolver для схемы', () => {
      const ir = makeIR(
        [],
        [makeSchema({ name: 'LoginForm', type: 'object' })],
      );
      const result = generateRhf(ir, baseConfig, valibotOpts);
      expect(result.code).toContain(
        'loginFormResolver = valibotResolver(LoginFormSchema)',
      );
    });
  });

  describe('resolver: yup', () => {
    test('импортирует yupResolver из @hookform/resolvers/yup', () => {
      const result = generateRhf(emptyIR, baseConfig, yupOpts);
      expect(result.code).toContain('yupResolver');
      expect(result.code).toContain('@hookform/resolvers/yup');
    });

    test('генерирует resolver для схемы', () => {
      const ir = makeIR([], [makeSchema({ name: 'Profile', type: 'object' })]);
      expect(generateRhf(ir, baseConfig, yupOpts).code).toContain(
        'profileResolver = yupResolver(ProfileSchema)',
      );
    });
  });

  describe('несколько схем', () => {
    test('генерирует resolver для каждой схемы', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({ name: 'User', type: 'object' }),
          makeSchema({ name: 'Post', type: 'object' }),
        ],
      );
      const result = generateRhf(ir, baseConfig, zodOpts);
      expect(result.code).toContain('userResolver');
      expect(result.code).toContain('postResolver');
      expect(result.exports).toHaveLength(2);
    });

    test('импортирует все schema names в одном import', () => {
      const ir = makeIR(
        [],
        [
          makeSchema({ name: 'User', type: 'object' }),
          makeSchema({ name: 'Post', type: 'object' }),
        ],
      );
      const result = generateRhf(ir, baseConfig, zodOpts);
      expect(result.code).toContain('UserSchema, PostSchema');
    });
  });

  describe('схема без name', () => {
    test('схема без name игнорируется', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      const result = generateRhf(ir, baseConfig, zodOpts);
      expect(result.exports).toHaveLength(0);
    });
  });

  describe('кастомный schemasImportPath', () => {
    test('использует кастомный путь импорта', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const opts = {
        resolver: 'zod' as const,
        schemaSuffix: 'Schema',
        schemasImportPath: '@/shared/schemas/zod',
      };
      expect(generateRhf(ir, baseConfig, opts).code).toContain(
        "from '@/shared/schemas/zod'",
      );
    });
  });

  describe('кастомный schemaSuffix', () => {
    test('использует кастомный суффикс', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const opts = {
        resolver: 'zod' as const,
        schemaSuffix: 'Validator',
        schemasImportPath: './zod',
      };
      const result = generateRhf(ir, baseConfig, opts);
      expect(result.code).toContain('UserValidator');
      expect(result.code).toContain('zodResolver(UserValidator)');
    });
  });
});
