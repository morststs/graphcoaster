export interface Vec2 {
  x: number;
  y: number;
}

export interface Segment {
  a: Vec2;
  b: Vec2;
}

export interface MarchingSquaresOptions {
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
  gridN?: number;
}

function addCrossing(pts: Vec2[], va: number, vb: number, pa: Vec2, pb: Vec2) {
  if (!Number.isFinite(va) || !Number.isFinite(vb)) return;
  if ((va > 0) === (vb > 0)) return;
  const t = va / (va - vb);
  pts.push({ x: pa.x + (pb.x - pa.x) * t, y: pa.y + (pb.y - pa.y) * t });
}

/** Extracts the zero-contour of F(x,y) as a set of line segments via marching squares. */
export function traceImplicitCurve(
  F: (x: number, y: number) => number,
  opts: MarchingSquaresOptions = {},
): Segment[] {
  const { xmin = -10, xmax = 10, ymin = -10, ymax = 10, gridN = 200 } = opts;
  const dx = (xmax - xmin) / gridN;
  const dy = (ymax - ymin) / gridN;

  const values: number[][] = [];
  for (let j = 0; j <= gridN; j++) {
    const y = ymin + j * dy;
    const row: number[] = [];
    for (let i = 0; i <= gridN; i++) {
      row.push(F(xmin + i * dx, y));
    }
    values.push(row);
  }

  const segments: Segment[] = [];
  for (let j = 0; j < gridN; j++) {
    for (let i = 0; i < gridN; i++) {
      const x0 = xmin + i * dx;
      const x1 = x0 + dx;
      const y0 = ymin + j * dy;
      const y1 = y0 + dy;

      const vbl = values[j][i];
      const vbr = values[j][i + 1];
      const vtr = values[j + 1][i + 1];
      const vtl = values[j + 1][i];

      const bl: Vec2 = { x: x0, y: y0 };
      const br: Vec2 = { x: x1, y: y0 };
      const tr: Vec2 = { x: x1, y: y1 };
      const tl: Vec2 = { x: x0, y: y1 };

      const pts: Vec2[] = [];
      addCrossing(pts, vbl, vbr, bl, br); // bottom edge
      addCrossing(pts, vbr, vtr, br, tr); // right edge
      addCrossing(pts, vtr, vtl, tr, tl); // top edge
      addCrossing(pts, vtl, vbl, tl, bl); // left edge

      if (pts.length === 2) {
        segments.push({ a: pts[0], b: pts[1] });
      } else if (pts.length === 4) {
        // Saddle case: disambiguate the two pairings using the cell-center sign.
        const center = (vbl + vbr + vtr + vtl) / 4;
        if (Math.sign(center) === Math.sign(vbl)) {
          segments.push({ a: pts[0], b: pts[3] }, { a: pts[1], b: pts[2] });
        } else {
          segments.push({ a: pts[0], b: pts[1] }, { a: pts[2], b: pts[3] });
        }
      }
    }
  }
  return segments;
}
