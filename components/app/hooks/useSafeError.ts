import { useCallback, useState } from 'react';

export function useSafeError() {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((err: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'An unexpected error occurred';
    setError(message);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, showError, clearError };
}
