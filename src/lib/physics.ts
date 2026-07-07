import type { Curve } from './curves';

export const GRAVITY = 6;
export const BALL_RADIUS = 0.25;
export const WAYPOINT_RADIUS = 0.5;
export const OUT_OF_BOUNDS = 10.5;
export const FIXED_DT = 1 / 120;
export const ROLLING_FRICTION = 0.2;

const IMPLICIT_EPS = 1e-6;
const GRAD_H = 1e-3;

export type BallMode = 'idle' | 'falling' | 'rolling';

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mode: BallMode;
  curveId: string | null;
  outsideSign: number;
}

interface Impact {
  t: number;
  curve: Curve;
}

function gradientAt(curve: Extract<Curve, { kind: 'implicit' }>, x: number, y: number) {
  const fx = (curve.F(x + GRAD_H, y) - curve.F(x - GRAD_H, y)) / (2 * GRAD_H);
  const fy = (curve.F(x, y + GRAD_H) - curve.F(x, y - GRAD_H)) / (2 * GRAD_H);
  return { fx, fy };
}

/** Approximate perpendicular distance from (x,y) to a curve, used to check for a ball/line overlap before dropping. */
function distanceToCurve(curve: Curve, x: number, y: number): number {
  if (curve.kind === 'explicit') {
    const fy = curve.yAt(x);
    if (!Number.isFinite(fy)) return Infinity;
    const slope = curve.slopeAt(x);
    return Math.abs(y - fy) / Math.hypot(1, slope);
  }
  const fval = curve.F(x, y);
  if (!Number.isFinite(fval)) return Infinity;
  const g = gradientAt(curve, x, y);
  const glen = Math.hypot(g.fx, g.fy) || 1;
  return Math.abs(fval) / glen;
}

/** Whether a ball centered at (x,y) already overlaps any of the given curves, accounting for its thickness. */
export function ballIntersectsCurves(x: number, y: number, curves: Curve[]): boolean {
  return curves.some((curve) => distanceToCurve(curve, x, y) <= BALL_RADIUS);
}

function tangentFor(curve: Curve, x: number, y: number, preferVx: number, preferVy: number) {
  if (curve.kind === 'explicit') {
    const slope = curve.slopeAt(x);
    const len = Math.hypot(1, slope);
    let t = { x: 1 / len, y: slope / len };
    if (t.x * preferVx + t.y * preferVy < 0) t = { x: -t.x, y: -t.y };
    return t;
  }
  const g = gradientAt(curve, x, y);
  const glen = Math.hypot(g.fx, g.fy) || 1;
  let t = { x: -g.fy / glen, y: g.fx / glen };
  if (t.x * preferVx + t.y * preferVy < 0) t = { x: -t.x, y: -t.y };
  return t;
}

function outwardNormalFor(curve: Curve, x: number, y: number, outsideSign: number) {
  const sign = outsideSign || 1;
  if (curve.kind === 'explicit') {
    const slope = curve.slopeAt(x);
    const len = Math.hypot(1, slope);
    return { x: (-slope / len) * sign, y: (1 / len) * sign };
  }
  const g = gradientAt(curve, x, y);
  const glen = Math.hypot(g.fx, g.fy) || 1;
  return { x: (sign * g.fx) / glen, y: (sign * g.fy) / glen };
}

/** Where the ball should be drawn: offset from the curve by BALL_RADIUS along the outward normal, so it visually rests on top of the line instead of being centered on it. */
export function ballDisplayPosition(ball: BallState, curves: Curve[]) {
  if (ball.mode !== 'rolling') return { x: ball.x, y: ball.y };
  const curve = curves.find((c) => c.id === ball.curveId);
  if (!curve) return { x: ball.x, y: ball.y };
  const n = outwardNormalFor(curve, ball.x, ball.y, ball.outsideSign);
  return { x: ball.x + BALL_RADIUS * n.x, y: ball.y + BALL_RADIUS * n.y };
}

/** Coulomb-style kinetic friction: constant deceleration opposing motion, clamped so it can't reverse direction. */
function applyFriction(vt: number, dt: number): number {
  const decel = ROLLING_FRICTION * dt;
  if (Math.abs(vt) <= decel) return 0;
  return vt - Math.sign(vt) * decel;
}

function findFirstCrossing(curves: Curve[], x0: number, y0: number, x1: number, y1: number): Impact | null {
  let best: Impact | null = null;
  for (const curve of curves) {
    let t: number | null = null;
    if (curve.kind === 'explicit') {
      const d0 = y0 - curve.yAt(x0);
      const d1 = y1 - curve.yAt(x1);
      if (Number.isFinite(d0) && Number.isFinite(d1) && Math.sign(d0) !== Math.sign(d1)) {
        t = d0 / (d0 - d1);
      }
    } else {
      const f0 = curve.F(x0, y0);
      const f1 = curve.F(x1, y1);
      if (Number.isFinite(f0) && Number.isFinite(f1) && Math.sign(f0) !== Math.sign(f1)) {
        t = f0 / (f0 - f1);
      }
    }
    if (t !== null && (best === null || t < best.t)) {
      best = { t, curve };
    }
  }
  return best;
}

function land(ball: BallState, curve: Curve, x: number, y: number, vx: number, vy: number, prevX: number, prevY: number) {
  const t = tangentFor(curve, x, y, vx, vy);
  const vt = vx * t.x + vy * t.y;
  ball.x = x;
  ball.y = y;
  ball.vx = t.x * vt;
  ball.vy = t.y * vt;
  ball.mode = 'rolling';
  ball.curveId = curve.id;
  if (curve.kind === 'implicit') {
    ball.outsideSign = Math.sign(curve.F(prevX, prevY)) || 1;
  } else {
    // +1 when falling onto the curve from above (the usual case), -1 when launched up into its underside.
    ball.outsideSign = Math.sign(prevY - curve.yAt(prevX)) || 1;
  }
}

function checkOutOfBounds(ball: BallState): boolean {
  if (Math.abs(ball.x) > OUT_OF_BOUNDS || ball.y < -OUT_OF_BOUNDS || ball.y > OUT_OF_BOUNDS * 2) {
    return true;
  }
  return false;
}

function stepFalling(ball: BallState, curves: Curve[], dt: number) {
  const prevX = ball.x;
  const prevY = ball.y;
  const vx = ball.vx;
  const vy = ball.vy - GRAVITY * dt;
  const nx = prevX + vx * dt;
  const ny = prevY + vy * dt;

  const hit = findFirstCrossing(curves, prevX, prevY, nx, ny);
  if (hit) {
    const ix = prevX + (nx - prevX) * hit.t;
    const iy = prevY + (ny - prevY) * hit.t;
    land(ball, hit.curve, ix, iy, vx, vy, prevX, prevY);
    return;
  }

  ball.x = nx;
  ball.y = ny;
  ball.vx = vx;
  ball.vy = vy;
}

function stepRolling(ball: BallState, curves: Curve[], dt: number) {
  const curve = curves.find((c) => c.id === ball.curveId);
  if (!curve) {
    ball.mode = 'falling';
    return;
  }

  const vx = ball.vx;
  const vy = ball.vy - GRAVITY * dt;
  const nx = ball.x + vx * dt;
  const ny = ball.y + vy * dt;

  if (curve.kind === 'explicit') {
    const surfaceY = curve.yAt(nx);
    const side = ball.outsideSign || 1;
    const departed = side >= 0 ? ny > surfaceY : ny < surfaceY;
    if (!Number.isFinite(surfaceY) || departed) {
      // Tentative free-flight position ended up past the surface on the side the
      // ball approached from: the curve curved away faster than gravity could
      // follow (or, hugging the underside, gravity pulled it off), so it departs.
      ball.mode = 'falling';
      ball.x = nx;
      ball.y = ny;
      ball.vx = vx;
      ball.vy = vy;
      return;
    }
    const t = tangentFor(curve, nx, surfaceY, vx, vy);
    const vt = applyFriction(vx * t.x + vy * t.y, dt);
    ball.x = nx;
    ball.y = surfaceY;
    ball.vx = t.x * vt;
    ball.vy = t.y * vt;
    return;
  }

  const fval = curve.F(nx, ny);
  if (!Number.isFinite(fval) || (Math.sign(fval) === ball.outsideSign && Math.abs(fval) > IMPLICIT_EPS)) {
    ball.mode = 'falling';
    ball.x = nx;
    ball.y = ny;
    ball.vx = vx;
    ball.vy = vy;
    return;
  }

  // Newton-correct the tentative point back onto the F(x,y)=0 contour.
  let px = nx;
  let py = ny;
  for (let i = 0; i < 2; i++) {
    const g = gradientAt(curve, px, py);
    const glen2 = g.fx * g.fx + g.fy * g.fy;
    if (glen2 < 1e-9) break;
    const fv = curve.F(px, py);
    px -= (fv * g.fx) / glen2;
    py -= (fv * g.fy) / glen2;
  }
  const t = tangentFor(curve, px, py, vx, vy);
  const vt = applyFriction(vx * t.x + vy * t.y, dt);
  ball.x = px;
  ball.y = py;
  ball.vx = t.x * vt;
  ball.vy = t.y * vt;
}

/** Advances the ball by one fixed physics substep. Returns true if the ball went out of bounds. */
export function stepBall(ball: BallState, curves: Curve[], dt: number): boolean {
  if (ball.mode === 'falling') {
    stepFalling(ball, curves, dt);
  } else if (ball.mode === 'rolling') {
    stepRolling(ball, curves, dt);
  }
  return checkOutOfBounds(ball);
}
