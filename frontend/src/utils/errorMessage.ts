type ErrorRecord = Record<string, unknown>;

const isErrorRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null;

export const getErrorMessage = (reason: unknown, fallback: string): string => {
  if (typeof reason === 'string' && reason.trim()) {
    return reason;
  }

  if (reason instanceof Error && typeof reason.message === 'string' && reason.message.trim()) {
    return reason.message;
  }

  if (!isErrorRecord(reason)) {
    return fallback;
  }

  if (typeof reason.message === 'string' && reason.message.trim()) {
    return reason.message;
  }

  if (isErrorRecord(reason.message)) {
    if (typeof reason.message.message === 'string' && reason.message.message.trim()) {
      return reason.message.message;
    }
    if (typeof reason.message.code === 'string') {
      return `Request failed (${reason.message.code}).`;
    }
  }

  if (typeof reason.error === 'string' && reason.error.trim()) {
    return reason.error;
  }

  if (isErrorRecord(reason.error)) {
    if (typeof reason.error.message === 'string' && reason.error.message.trim()) {
      return reason.error.message;
    }
    if (typeof reason.error.code === 'string') {
      return `Request failed (${reason.error.code}).`;
    }
  }

  if (typeof reason.code === 'string') {
    return `Request failed (${reason.code}).`;
  }

  return fallback;
};
