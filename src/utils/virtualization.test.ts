import { getVirtualRange } from './virtualization';

describe('getVirtualRange', () => {
  test('handles an empty list', () => {
    const result = getVirtualRange([], 0, 600);

    expect(result.totalHeight).toBe(0);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
  });

  test('calculates total height', () => {
    const result = getVirtualRange([100, 150, 200], 0, 300, 0);

    expect(result.totalHeight).toBe(450);
  });

  test('renders only a small portion of 10000 messages', () => {
    const heights = Array(10000).fill(80);

    const result = getVirtualRange(heights, 200000, 640, 5);

    expect(result.endIndex - result.startIndex).toBeLessThan(30);
    expect(result.totalHeight).toBe(800000);
  });

  test('calculates padding correctly', () => {
    const heights = Array(100).fill(100);

    const result = getVirtualRange(heights, 2000, 500, 0);

    expect(result.startIndex).toBe(20);
    expect(result.paddingTop).toBe(2000);
    expect(result.totalHeight).toBe(10000);
  });
});
