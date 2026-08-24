import { banner } from '@constants';

export const APIG_ERROR_CLASS = 'ApigError';
export const APIG_CONFIG_FILE = 'config';
export const PARSE_ERROR_FN = 'parseErrorBody';

/**
 * Error responses are not always JSON — a gateway 502 or a plain-text 404 will
 * make `response.json()` throw, which would replace the real status code with a
 * parse error. Reading as text first keeps the status intact either way.
 */
export const parseErrorBodyCode = `export const parseErrorBody = async (
  response: Response,
): Promise<unknown> => {
  const text = await response.text().catch(() => '');
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};
`;

export const apigErrorCode = `export class ApigError<T = unknown> extends Error {
  status: number;
  body: T;
  constructor(status: number, body: T) {
    super(\`ApigError \${status}\`);
    this.name = 'ApigError';
    this.status = status;
    this.body = body;
  }
}
`;

export const apigResponseCode = `export interface ApigResponse<T> {
  body: T;
  status: number;
  headers: Headers;
}
`;

export const TO_QUERY_FN = 'toQuery';

export const toQueryCode = `/**
 * Serialization of an array or object query parameter, mirroring the
 * style/explode pair from the OpenAPI spec:
 *   repeat — style: form,           explode: true   ?id=1&id=2
 *   comma  — style: form,           explode: false  ?id=1,2
 *   space  — style: spaceDelimited, explode: false  ?id=1 2
 *   pipe   — style: pipeDelimited,  explode: false  ?id=1|2
 *   deep   — style: deepObject                      ?id[a]=1
 */
export type QueryFormat = 'repeat' | 'comma' | 'space' | 'pipe' | 'deep';

const QUERY_DELIMITERS: Record<string, string> = {
  comma: ',',
  space: ' ',
  pipe: '|',
};

export const toQuery = (
  params?: Record<string, unknown>,
  formats: Record<string, QueryFormat> = {},
): string => {
  if (!params) return '';

  const search = new URLSearchParams();

  const append = (key: string, value: unknown): void => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  };

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    const format = formats[key] ?? 'repeat';

    if (Array.isArray(value)) {
      const items = value.filter((item) => item !== undefined && item !== null);
      if (format === 'repeat') {
        for (const item of items) append(key, item);
      } else if (items.length > 0) {
        append(key, items.map(String).join(QUERY_DELIMITERS[format] ?? ','));
      }
      continue;
    }

    if (format === 'deep' && typeof value === 'object') {
      for (const [prop, inner] of Object.entries(value as Record<string, unknown>)) {
        append(\`\${key}[\${prop}]\`, inner);
      }
      continue;
    }

    append(key, value);
  }

  const query = search.toString();
  return query ? \`?\${query}\` : '';
};
`;

export const buildApigConfigFile = (
  withError: boolean,
  withResponse: boolean,
  withQuery = false,
  withParseError = false,
): string => {
  const parts: string[] = [banner];
  if (withError) parts.push(apigErrorCode);
  if (withParseError) parts.push(parseErrorBodyCode);
  if (withResponse) parts.push(apigResponseCode);
  if (withQuery) parts.push(toQueryCode);
  return parts.join('\n');
};
