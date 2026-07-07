import { game, getCurrentStage, getActiveCurves } from './gameState.svelte';
import { stepBall, FIXED_DT, WAYPOINT_RADIUS } from './physics';

let accumulator = 0;

function checkWaypoints() {
  for (const wp of game.waypoints) {
    if (wp.visited) continue;
    if (Math.hypot(game.ball.x - wp.x, game.ball.y - wp.y) <= WAYPOINT_RADIUS) {
      wp.visited = true;
    }
  }
  if (!game.cleared && game.waypoints.length > 0 && game.waypoints.every((w) => w.visited)) {
    game.cleared = true;
  }
}

function resetToDrop() {
  const stage = getCurrentStage();
  game.ball.x = stage.drop.x;
  game.ball.y = stage.drop.y;
  game.ball.vx = 0;
  game.ball.vy = 0;
  game.ball.mode = 'idle';
  game.ball.curveId = null;
}

function substep() {
  if (game.ball.mode !== 'falling' && game.ball.mode !== 'rolling') return;
  const outOfBounds = stepBall(game.ball, getActiveCurves(), FIXED_DT);
  if (outOfBounds) {
    resetToDrop();
    return;
  }
  checkWaypoints();
}

/** Advances the physics simulation by wall-clock deltaSec using a fixed-timestep accumulator. */
export function advance(deltaSec: number) {
  accumulator += Math.min(deltaSec, 0.25);
  while (accumulator >= FIXED_DT) {
    substep();
    accumulator -= FIXED_DT;
  }
}
