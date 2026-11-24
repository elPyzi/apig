export interface ZvyappyErrorLike {
  name: string;
  status: number;
  body: unknown;
}

export const isZvyappyError = (error: unknown): error is ZvyappyErrorLike =>
  error instanceof Error &&
  error.name === 'ZvyappyError' &&
  'status' in error &&
  'body' in error;

export const isZvyappyStatus = (
  error: unknown,
  status: number,
): error is ZvyappyErrorLike =>
  isZvyappyError(error) && error.status === status;
