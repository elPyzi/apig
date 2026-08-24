import { describe, test, expect } from 'bun:test';
import {
  buildQueryFormats,
  hasCustomQueryFormat,
  queryFormat,
} from '@services/codegen/common/query-formats';
import { QUERY_STYLES, type IRProperty, type QueryStyle } from '@models';

const param = (
  name: string,
  style?: QueryStyle,
  explode?: boolean,
): IRProperty => ({
  name,
  required: false,
  type: 'array',
  style,
  explode,
});

describe('queryFormat', () => {
  test('form with explode is the default and needs no annotation', () => {
    expect(queryFormat(param('a', QUERY_STYLES.FORM, true))).toBe('repeat');
  });

  test('a parameter without a style falls back to repeat', () => {
    expect(queryFormat(param('a'))).toBe('repeat');
  });

  test('form without explode becomes comma separated', () => {
    expect(queryFormat(param('a', QUERY_STYLES.FORM, false))).toBe('comma');
  });

  test('spaceDelimited becomes space', () => {
    expect(queryFormat(param('a', QUERY_STYLES.SPACE_DELIMITED, false))).toBe(
      'space',
    );
  });

  test('pipeDelimited becomes pipe', () => {
    expect(queryFormat(param('a', QUERY_STYLES.PIPE_DELIMITED, false))).toBe(
      'pipe',
    );
  });

  test('deepObject becomes deep', () => {
    expect(queryFormat(param('a', QUERY_STYLES.DEEP_OBJECT, true))).toBe(
      'deep',
    );
  });
});

describe('buildQueryFormats', () => {
  test('all-default parameters produce no argument at all', () => {
    expect(
      buildQueryFormats([param('a', QUERY_STYLES.FORM, true), param('b')]),
    ).toBeNull();
  });

  test('only the non-default parameters are listed', () => {
    expect(
      buildQueryFormats([
        param('tags', QUERY_STYLES.FORM, true),
        param('ids', QUERY_STYLES.FORM, false),
        param('cols', QUERY_STYLES.PIPE_DELIMITED, false),
      ]),
    ).toBe(`{ 'ids': 'comma', 'cols': 'pipe' }`);
  });

  test('an empty parameter list produces no argument', () => {
    expect(buildQueryFormats([])).toBeNull();
  });
});

describe('hasCustomQueryFormat', () => {
  test('is false when everything uses the default', () => {
    expect(hasCustomQueryFormat([param('a', QUERY_STYLES.FORM, true)])).toBe(
      false,
    );
  });

  test('is true as soon as one parameter differs', () => {
    expect(
      hasCustomQueryFormat([
        param('a'),
        param('b', QUERY_STYLES.SPACE_DELIMITED, false),
      ]),
    ).toBe(true);
  });
});
