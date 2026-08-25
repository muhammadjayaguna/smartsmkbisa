"use client";

import { useSearchParams as useNextSearchParams, useParams as useNextParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Next.js searchParams is ReadonlyURLSearchParams, which implements standard URLSearchParams interface for reading.
  // We provide a function to update the URL.
  const setSearchParams = useCallback(
    (newParams: URLSearchParams | Record<string, string>) => {
      let paramsString = '';
      if (newParams instanceof URLSearchParams) {
        paramsString = newParams.toString();
      } else {
        const params = new URLSearchParams(newParams);
        paramsString = params.toString();
      }
      router.push(`${pathname}?${paramsString}`);
    },
    [pathname, router]
  );

  // Return a fresh URLSearchParams instance so callers can use .set() without it crashing, even though they shouldn't mutate it directly without calling setSearchParams.
  // Actually, to match react-router, we just return searchParams directly since read methods are the same.
  // Wait, if they do `const params = new URLSearchParams(searchParams);`, it works.
  return [searchParams, setSearchParams] as const;
}

export function useParams() {
  return useNextParams();
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  
  return useMemo(() => ({
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: '',
    state: null,
  }), [pathname, searchParams]);
}
