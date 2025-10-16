import { useMemo } from "react";

const phi = 1.618;

/**
 * Hook to generate golden-ratio-based delay sequence.
 * @param firstDelay Starting delay for the first element.
 * @param firstIncrement Initial increment between delays.
 * @param count Number of elements.
 * @returns Array of cumulative delays.
 */
export function useGoldenRatio(firstDelay: number, firstIncrement: number, count: number): number[] {
  return useMemo(() => {
    const delays: number[] = [firstDelay];
    let increment = firstIncrement;

    for (let i = 1; i < count; i++) {
      delays.push(delays[i - 1] + increment);
      increment = increment / phi;
    }

    return delays;
  }, [firstDelay, firstIncrement, count]);
}
