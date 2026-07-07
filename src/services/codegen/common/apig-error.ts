export const APIG_ERROR_CLASS = 'ApigError';
export const APIG_CONFIG_FILE = 'config';

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

export const buildApigConfigFile = (withError: boolean, withResponse: boolean): string => {
  const parts: string[] = [];
  if (withError) parts.push(apigErrorCode);
  if (withResponse) parts.push(apigResponseCode);
  return parts.join('\n');
};
