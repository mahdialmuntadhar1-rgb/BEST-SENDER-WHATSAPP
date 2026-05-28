import { useState, useEffect, useCallback, useRef } from 'react';
import { getBusinesses } from '../api/businesses';
import { Business } from '../types/business';

interface UseInfiniteBusinessesOptions {
  limit?: number;
  type?: string;
  governorate?: string;
  enableInfiniteScroll?: boolean;
}

interface UseInfiniteBusinessesReturn {
  businesses: Business[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  loadMore: () => void;
  refresh: () => void;
}

export function useInfiniteBusinesses(
  options: UseInfiniteBusinessesOptions = {}
): UseInfiniteBusinessesReturn {
  const { limit = 20, type, governorate, enableInfiniteScroll = true } = options;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchBatch = useCallback(
    async (cursorValue?: string, isAppend = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!isAppend) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await getBusinesses({
          cursor: cursorValue,
          limit,
          type,
          governorate,
        });

        if (response.success) {
          setBusinesses((prev) =>
            isAppend ? [...prev, ...response.data] : response.data
          );
          setHasMore(response.has_more);
          setCursor(response.next_cursor);
        } else {
          setError('Failed to load businesses');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load businesses');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [limit, type, governorate]
  );

  // Initial load
  useEffect(() => {
    setBusinesses([]);
    setCursor(null);
    setHasMore(false);
    fetchBatch(undefined, false);
  }, [fetchBatch, type, governorate]);

  const loadMore = useCallback(() => {
    if (cursor && !loadingMore && hasMore) {
      fetchBatch(cursor, true);
    }
  }, [cursor, loadingMore, hasMore, fetchBatch]);

  const refresh = useCallback(() => {
    setBusinesses([]);
    setCursor(null);
    setHasMore(false);
    fetchBatch(undefined, false);
  }, [fetchBatch]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!enableInfiniteScroll) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enableInfiniteScroll, hasMore, loadingMore, loading, loadMore]);

  return {
    businesses,
    loading,
    loadingMore,
    error,
    hasMore,
    cursor,
    loadMore,
    refresh,
  };
}
