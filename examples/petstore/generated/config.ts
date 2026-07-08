export class ApigError<T = unknown> extends Error {
  status: number;
  body: T;
  constructor(status: number, body: T) {
    super(`ApigError ${status}`);
    this.name = 'ApigError';
    this.status = status;
    this.body = body;
  }
}
