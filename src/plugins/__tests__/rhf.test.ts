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
  describe('factory', () => {
    test('returns a plugin with the right metadata', () => {
      const plugin = rhf({ resolver: 'zod' });
      expect(plugin.name).toBe('rhf');
      expect(plugin.fileName).toBe('rhf');
      expect(plugin.scope).toBe('root');
    });

    test('schemaSuffix defaults to Schema', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = rhf({ resolver: 'zod' }).generate!(ir, baseConfig);
      expect(result.code).toContain('UserSchema');
    });

    test("schemasImportPath defaults to './zod' for zod", () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = rhf({ resolver: 'zod' }).generate!(ir, baseConfig);
      expect(result.code).toContain("from './zod'");
    });
  });

  describe('empty IR', () => {
    test('contains the banner', () => {
      const result = generateRhf(emptyIR, baseConfig, zodOpts);
      expect(result.code).toContain('auto-generated');
    });

    test('exports is empty when there are no schemas', () => {
      const result = generateRhf(emptyIR, baseConfig, zodOpts);
      expect(result.exports).toEqual([]);
    });

    test('typeExports is always empty', () => {
      expect(generateRhf(emptyIR, baseConfig, zodOpts).typeExports).toEqual([]);
    });
  });

  describe('resolver: zod', () => {
    test('imports zodResolver from @hookform/resolvers/zod', () => {
      const result = generateRhf(emptyIR, baseConfig, zodOpts);
      expect(result.code).toContain('zodResolver');
      expect(result.code).toContain('@hookform/resolvers/zod');
    });

    test('generates a resolver for the schema', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      const result = generateRhf(ir, baseConfig, zodOpts);
      expect(result.code).toContain('userResolver = zodResolver(UserSchema)');
    });

    test('exports the resolver', () => {
      const ir = makeIR([], [makeSchema({ name: 'User', type: 'object' })]);
      expect(generateRhf(ir, baseConfig, zodOpts).exports).toContain(
        'userResolver',
      );
    });
  });

  describe('resolver: valibot', () => {
    test('imports valibotResolver from @hookform/resolvers/valibot', () => {
      const result = generateRhf(emptyIR, baseConfig, valibotOpts);
      expect(result.code).toContain('valibotResolver');
      expect(result.code).toContain('@hookform/resolvers/valibot');
    });

    test('generates a resolver for the schema', () => {
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
    test('imports yupResolver from @hookform/resolvers/yup', () => {
      const result = generateRhf(emptyIR, baseConfig, yupOpts);
      expect(result.code).toContain('yupResolver');
      expect(result.code).toContain('@hookform/resolvers/yup');
    });

    test('generates a resolver for the schema', () => {
      const ir = makeIR([], [makeSchema({ name: 'Profile', type: 'object' })]);
      expect(generateRhf(ir, baseConfig, yupOpts).code).toContain(
        'profileResolver = yupResolver(ProfileSchema)',
      );
    });
  });

  describe('several schemas', () => {
    test('generates a resolver for every schema', () => {
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

    test('imports every schema name in a single import', () => {
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

  describe('schema without a name', () => {
    test('a schema without a name is ignored', () => {
      const ir = makeIR([], [makeSchema({ type: 'object' })]);
      const result = generateRhf(ir, baseConfig, zodOpts);
      expect(result.exports).toHaveLength(0);
    });
  });

  describe('custom schemasImportPath', () => {
    test('uses a custom import path', () => {
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

  describe('custom schemaSuffix', () => {
    test('uses a custom suffix', () => {
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
