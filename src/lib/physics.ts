import type { Curve } from './curves';

export const GRAVITY = 6;
export const BALL_RADIUS = 0.25;
export const WAYPOINT_RADIUS = 0.5;
export const OUT_OF_BOUNDS = 10.5;
export const FIXED_DT = 1 / 120;

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

function findFirstCrossing(curves: Curve[], x0: number, y0: number, x1: number, y1: number): Impact | null {
  let best: Impact | null = null;
  for (const curve of curves) {
    let t: number | null = null;
    if (curve.kind === 'explicit') {
      const d0 = y0 - curve.yAt(x0);
      const d1 = y1 - curve.yAt(x1);
      if (Number.isFinite(d0) && Number.isFinite(d1) && d0 >= 0 && d1 < 0) {
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
    if (!Number.isFinite(surfaceY) || ny > surfaceY) {
      // Tentative free-flight position ended up above the surface: the curve
      // curved away faster than gravity could follow, so the ball departs.
      ball.mode = 'falling';
      ball.x = nx;
      ball.y = ny;
      ball.vx = vx;
      ball.vy = vy;
      return;
    }
    const t = tangentFor(curve, nx, surfaceY, vx, vy);
    const vt = vx * t.x + vy * t.y;
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
  const vt = vx * t.x + vy * t.y;
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
