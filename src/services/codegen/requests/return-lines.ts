/**
 * Hands `expr` back from a request function, logging it first under `apiLogging`.
 * The log goes where the value is returned rather than after the body: inside a
 * `try` a value declared there is out of scope below it, and after a `return`
 * the log never runs.
 */
export const returnLines = (
  expr: string,
  indent: string,
  logAs?: string,
): string[] =>
  logAs
    ? [
        `${indent}const response = ${expr};`,
        `${indent}console.log('${logAs}', response);`,
        `${indent}return response;`,
      ]
    : [`${indent}return ${expr};`];

/**
 * ky 2 reads an error body into `error.data` and leaves the response consumed,
 * so `response.json()` throws "Body already used"; ky 1 has no `data` and the
 * body is still there to read.
 */
export const KY_ERROR_BODY =
  "'data' in err ? err.data : await err.response.json().catch(() => undefined)";
