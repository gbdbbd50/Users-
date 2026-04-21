'use client';

import { useMemo, useRef } from 'react';

/**
 * A custom hook to memoize Firebase references and queries.
 * It ensures that the reference/query only changes when its dependencies change,
 * preventing infinite loops in useCollection and useDoc.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
