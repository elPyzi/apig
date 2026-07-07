export interface ApigErrorLike {
  name: string;
  status: number;
  body: unknown;
}

export const isApigError = (error: unknown): error is ApigErrorLike =>
  error instanceof Error &&
  error.name === 'ApigError' &&
  'status' in error &&
  'body' in error;

export const isApigStatus = (
  error: unknown,
  status: number,
): error is ApigErrorLike => isApigError(error) && error.status === status;
