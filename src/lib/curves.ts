import type { ParsedFormula } from './formulaParser';
import { traceImplicitCurve, type Segment } from './marchingSquares';

export interface ExplicitCurve {
  id: string;
  kind: 'explicit';
  raw: string;
  color: string;
  yAt: (x: number) => number;
  slopeAt: (x: number) => number;
  segments: Segment[];
}

export interface ImplicitCurve {
  id: string;
  kind: 'implicit';
  raw: string;
  color: string;
  F: (x: number, y: number) => number;
  segments: Segment[];
}

export type Curve = ExplicitCurve | ImplicitCurve;

let nextCurveId = 0;

const EXPLICIT_SAMPLES = 400;

export function buildCurve(parsed: ParsedFormula, raw: string, color: string): Curve {
  const id = `curve-${nextCurveId++}`;

  if (parsed.kind === 'explicit') {
    const segments: Segment[] = [];
    let prev: { x: number; y: number } | null = null;
    for (let i = 0; i <= EXPLICIT_SAMPLES; i++) {
      const x = -10 + (20 * i) / EXPLICIT_SAMPLES;
      const y = parsed.yAt(x);
      if (Number.isFinite(y)) {
        const current = { x, y };
        if (prev) segments.push({ a: prev, b: current });
        prev = current;
      } else {
        prev = null;
      }
    }
    return { id, kind: 'explicit', raw, color, yAt: parsed.yAt, slopeAt: parsed.slopeAt, segments };
  }

  const segments = traceImplicitCurve(parsed.F, { gridN: 200 });
  return { id, kind: 'implicit', raw, color, F: parsed.F, segments };
}
