export const TO_PARAMS_FN = 'toParams';
export const TO_HEADERS_FN = 'toHeaders';
export const TO_MULTIPART_FN = 'toMultipart';
export const PARSE_API_ERROR_FN = 'parseApiError';

/**
 * `URLSearchParams` rather than a plain object: Playwright accepts both, but only
 * the former can repeat a key, which is how an array query parameter is sent.
 * It also sidesteps the optional-property mismatch a typed params object hits
 * against Playwright's index signature.
 */
export const toParamsCode = `const ${TO_PARAMS_FN} = (
  params?: Record<string, unknown>,
): URLSearchParams => {
  const search = new URLSearchParams();
  if (!params) return search;

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) search.append(key, String(item));
      }
      continue;
    }

    search.append(key, String(value));
  }

  return search;
};
`;

/** Header values are typed from the spec (a number, an enum) but must go out as strings. */
export const toHeadersCode = `const ${TO_HEADERS_FN} = (
  headers?: Record<string, unknown>,
): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!headers) return out;

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) out[key] = String(value);
  }

  return out;
};
`;

/**
 * Playwright's `multipart` option rejects `undefined`, so an optional form field
 * has to be dropped rather than passed through.
 */
export const toMultipartCode = `type MultipartValue =
  | string
  | number
  | boolean
  | { name: string; mimeType: string; buffer: Buffer };

const ${TO_MULTIPART_FN} = (
  fields: Record<string, MultipartValue | undefined>,
): Record<string, MultipartValue> => {
  const out: Record<string, MultipartValue> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) out[key] = value;
  }

  return out;
};
`;

/**
 * Playwright's `APIResponse` is not a fetch `Response`, so the requests plugin's
 * `parseErrorBody` cannot type-check against it — same logic, local copy.
 * Reading as text first keeps the status when the body is not JSON.
 */
export const parseApiErrorCode = `const ${PARSE_API_ERROR_FN} = async (
  response: APIResponse,
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
