/**
 * Random number generation utilities
 */

export type RNG = () => number;

/**
 * Create a seeded random number generator
 */
export function mkRng(seed: number): RNG {
  let s = seed | 0;
  return function() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random number in range [a, b]
 */
export function rr(rng: RNG, a: number, b: number): number {
  return a + rng() * (b - a);
}

/**
 * Random gaussian with mean m and stddev s
 */
export function rg(rng: RNG, m: number, s: number): number {
  const u1 = rng();
  const u2 = rng();
  return m + Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2) * s;
}
