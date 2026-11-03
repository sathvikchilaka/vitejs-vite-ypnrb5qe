import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

interface VirtualizerOptions {
  itemIds: string[];
  estimatedHeight?: number;
  overscan?: number;
}

export function useVirtualizer({
  itemIds,
  estimatedHeight = 88,
  overscan = 6,
}: VirtualizerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const heightsRef = useRef(new Map<string, number>());
  const observersRef = useRef(new Map<string, ResizeObserver>());

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const offsets = useMemo(() => {
    const result = new Array<number>(itemIds.length + 1);

    result[0] = 0;

    for (let i = 0; i < itemIds.length; i++) {
      result[i + 1] =
        result[i] + (heightsRef.current.get(itemIds[i]) ?? estimatedHeight);
    }

    return result;
  }, [itemIds, estimatedHeight, measurementVersion]);

  const totalHeight = offsets[itemIds.length];

  const findIndex = useCallback(
    (position: number) => {
      if (itemIds.length === 0) return 0;

      let left = 0;
      let right = itemIds.length - 1;

      while (left < right) {
        const middle = Math.floor((left + right) / 2);

        if (offsets[middle + 1] <= position) {
          left = middle + 1;
        } else {
          right = middle;
        }
      }

      return left;
    },
    [itemIds.length, offsets]
  );

  const range = useMemo(() => {
    if (!itemIds.length) {
      return {
        startIndex: 0,
        endIndex: 0,
        paddingTop: 0,
        paddingBottom: 0,
        totalHeight: 0,
      };
    }

    const firstVisible = findIndex(scrollTop);

    const lastVisible = findIndex(scrollTop + viewportHeight);

    const startIndex = Math.max(0, firstVisible - overscan);

    const endIndex = Math.min(itemIds.length, lastVisible + overscan + 1);

    return {
      startIndex,
      endIndex,
      paddingTop: offsets[startIndex],
      paddingBottom: totalHeight - offsets[endIndex],
      totalHeight,
    };
  }, [
    itemIds.length,
    scrollTop,
    viewportHeight,
    overscan,
    offsets,
    totalHeight,
    findIndex,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(() => {
      setViewportHeight(container.clientHeight);
    });

    observer.observe(container);

    setViewportHeight(container.clientHeight);
    setScrollTop(container.scrollTop);

    return () => observer.disconnect();
  }, []);

  const measureElement = useCallback(
    (id: string, element: HTMLElement | null) => {
      observersRef.current.get(id)?.disconnect();
      observersRef.current.delete(id);

      if (!element) return;

      const observer = new ResizeObserver((entries) => {
        const height =
          entries[0]?.borderBoxSize?.[0]?.blockSize ??
          element.getBoundingClientRect().height;

        const previous = heightsRef.current.get(id);

        if (previous === height) return;

        heightsRef.current.set(id, height);

        setMeasurementVersion((version) => version + 1);
      });

      observer.observe(element);
      observersRef.current.set(id, observer);
    },
    []
  );

  useLayoutEffect(() => {
    return () => {
      observersRef.current.forEach((observer) => {
        observer.disconnect();
      });

      observersRef.current.clear();
    };
  }, []);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;

    setScrollTop(container.scrollTop);
  }, []);

  return {
    containerRef,
    onScroll,
    measureElement,
    range,
    scrollToBottom,
    findIndex,
    offsets,
  };
}
