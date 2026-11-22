import { describe, test, expect } from 'bun:test';
import { zod } from '../zod';
import { valibot } from '../valibot';
import { yup } from '../yup';
import { baseConfig, makeIR, makeSchema } from './fixtures';

// `Pet` and `Owner` reach each other, so each validator annotates `Pet` with its
// type — where `rank` is the TypeScript enum `PetRank` under enumStyle 'enum'.
const ir = makeIR(
  [],
  [
    makeSchema({
      name: 'Pet',
      properties: [
        {
          name: 'rank',
          required: false,
          type: 'string',
          schema: { type: 'string', isEnum: true, enum: ['low', 'high'] },
        },
        {
          name: 'owner',
          required: false,
          type: 'object',
          schema: { type: 'object', name: 'Owner' },
        },
      ],
    }),
    makeSchema({
      name: 'Owner',
      properties: [
        {
          name: 'pet',
          required: false,
          type: 'object',
          schema: { type: 'object', name: 'Pet' },
        },
      ],
    }),
  ],
);
const config = { ...baseConfig, enumStyle: 'enum' as const };

describe('an inline enum of a recursive schema under enumStyle enum', () => {
  test('zod validates it with the enum, not its values', () => {
    const { code } = zod().generate(ir, config);
    expect(code).toContain('export enum PetRank {');
    expect(code).toContain('  rank: z.nativeEnum(PetRank).optional(),');
  });

  test('valibot does too', () => {
    const { code } = valibot().generate(ir, config);
    expect(code).toContain('  rank: v.optional(v.enum(PetRank)),');
  });

  test('yup does too', () => {
    const { code } = yup().generate(ir, config);
    expect(code).toContain(
      '  rank: yup.mixed<PetRank>().oneOf(Object.values(PetRank) as PetRank[]).optional(),',
    );
  });

  test('with the types in types.ts, the enum is imported as a value', () => {
    for (const plugin of [
      zod({ withTypes: false }),
      valibot({ withTypes: false }),
      yup({ withTypes: false }),
    ]) {
      const { code } = plugin.generate(ir, config);
      expect(code).toContain("import type { Owner, Pet } from './types';");
      expect(code).toContain("import { PetRank } from './types';");
    }
  });

  test('other enum styles keep the literal values', () => {
    const { code } = zod().generate(ir, { ...config, enumStyle: 'union' });
    expect(code).toContain("z.enum(['low', 'high'])");
    expect(code).not.toContain('nativeEnum');
  });
});
