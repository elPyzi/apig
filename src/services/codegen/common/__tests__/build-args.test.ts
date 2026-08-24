import { describe, test, expect } from 'bun:test';
import {
  buildArgsList,
  buildCallArgs,
} from '@services/codegen/common/build-args';
import type { FnArg } from '@services/codegen/common/get-args';

const arg = (name: string, required: boolean, type = 'string'): FnArg => ({
  name,
  type,
  required,
});

describe('buildArgsList', () => {
  test('required arguments keep a plain annotation', () => {
    expect(buildArgsList([arg('id', true)])).toBe('id: string');
  });

  test('a trailing optional argument takes a question mark', () => {
    expect(buildArgsList([arg('id', true), arg('params', false)])).toBe(
      'id: string, params?: string',
    );
  });

  test('every trailing optional argument takes a question mark', () => {
    expect(buildArgsList([arg('params', false), arg('headers', false)])).toBe(
      'params?: string, headers?: string',
    );
  });

  test('an optional argument followed by a required one widens instead', () => {
    // `params?: X, body: Y` is TS1016 — a required parameter cannot follow an
    // optional one — so the optional argument stays positional
    expect(buildArgsList([arg('params', false), arg('body', true)])).toBe(
      'params: string | undefined, body: string',
    );
  });

  test('only the optionals before a required one are widened', () => {
    expect(
      buildArgsList([
        arg('params', false),
        arg('body', true),
        arg('headers', false),
      ]),
    ).toBe('params: string | undefined, body: string, headers?: string');
  });
});

describe('buildCallArgs', () => {
  test('passes arguments through by name', () => {
    expect(buildCallArgs([arg('id', true), arg('body', false)])).toBe(
      'id, body',
    );
  });
});
