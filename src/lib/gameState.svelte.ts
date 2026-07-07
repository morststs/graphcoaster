import { STAGES, type Stage } from './stages';
import { parseFormula, FormulaError } from './formulaParser';
import { buildCurve, type Curve } from './curves';

export interface FormulaSlot {
  id: string;
  text: string;
  color: string;
  error: string | null;
  curve: Curve | null;
}

export interface WaypointState {
  x: number;
  y: number;
  visited: boolean;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mode: 'idle' | 'falling' | 'rolling';
  curveId: string | null;
  outsideSign: number;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4'];
const MAX_FORMULAS = 6;

let slotCounter = 0;

function makeFormulaSlot(index: number): FormulaSlot {
  return { id: `f-${slotCounter++}`, text: '', color: COLORS[index % COLORS.length], error: null, curve: null };
}

function makeBallAtDrop(stage: Stage): BallState {
  return { x: stage.drop.x, y: stage.drop.y, vx: 0, vy: 0, mode: 'idle', curveId: null, outsideSign: 1 };
}

function makeWaypoints(stage: Stage): WaypointState[] {
  return stage.waypoints.map((w) => ({ x: w.x, y: w.y, visited: false }));
}

export const game = $state({
  stageIndex: 0,
  formulas: [makeFormulaSlot(0)] as FormulaSlot[],
  ball: makeBallAtDrop(STAGES[0]),
  waypoints: makeWaypoints(STAGES[0]),
  cleared: false,
});

export function getCurrentStage(): Stage {
  return STAGES[game.stageIndex];
}

export function getActiveCurves(): Curve[] {
  return game.formulas.map((f) => f.curve).filter((c): c is Curve => c !== null);
}

export function addFormula() {
  if (game.formulas.length >= MAX_FORMULAS) return;
  game.formulas.push(makeFormulaSlot(game.formulas.length));
}

export function removeFormula(id: string) {
  if (game.formulas.length <= 1) return;
  game.formulas = game.formulas.filter((f) => f.id !== id);
}

export function updateFormulaText(id: string, text: string) {
  const slot = game.formulas.find((f) => f.id === id);
  if (!slot) return;
  slot.text = text;
  if (!text.trim()) {
    slot.curve = null;
    slot.error = null;
    return;
  }
  try {
    const parsed = parseFormula(text);
    slot.curve = buildCurve(parsed, text, slot.color);
    slot.error = null;
  } catch (e) {
    slot.curve = null;
    slot.error = e instanceof FormulaError ? e.message : '数式を解析できませんでした';
  }
}

export function dropBall() {
  if (game.ball.mode !== 'idle') return;
  game.ball.mode = 'falling';
}

export function resetBall() {
  const stage = getCurrentStage();
  game.ball = makeBallAtDrop(stage);
  game.waypoints = makeWaypoints(stage);
  game.cleared = false;
}

export function nextStage() {
  game.stageIndex = (game.stageIndex + 1) % STAGES.length;
  const stage = getCurrentStage();
  game.formulas = [makeFormulaSlot(0)];
  game.ball = makeBallAtDrop(stage);
  game.waypoints = makeWaypoints(stage);
  game.cleared = false;
}
