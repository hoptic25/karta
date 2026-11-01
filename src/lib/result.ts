export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function failure(message: string, code = "ERROR"): Result<never> {
  return { ok: false, error: { code, message } };
}

