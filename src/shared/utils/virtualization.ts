export interface VirtualRange {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
  totalHeight: number;
}

export function getVirtualRange(
  heights: number[],
  scrollTop: number,
  viewportHeight: number,
  overscan = 5
): VirtualRange {
  const offsets = [0];
  for (const height of heights) offsets.push(offsets[offsets.length - 1] + height);
  const totalHeight = offsets[heights.length];

  let first = 0;
  while (first < heights.length - 1 && offsets[first + 1] <= scrollTop) first++;

  let last = first;
  while (last < heights.length - 1 && offsets[last + 1] < scrollTop + viewportHeight) last++;

  const startIndex = Math.max(0, first - overscan);
  const endIndex = heights.length ? Math.min(heights.length, last + overscan + 1) : 0;

  return {
    startIndex,
    endIndex,
    paddingTop: offsets[startIndex],
    paddingBottom: totalHeight - offsets[endIndex],
    totalHeight,
  };
}
