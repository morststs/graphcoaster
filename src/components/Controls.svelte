<script lang="ts">
  import { Button, Helper } from 'flowbite-svelte';
  import { game, dropBall, resetBall, nextStage, canDrop } from '../lib/gameState.svelte';

  let blockedByOverlap = $derived(game.ball.mode === 'idle' && !canDrop());
</script>

<div class="flex flex-col gap-1">
  <div class="flex flex-wrap gap-2">
    <Button color="primary" onclick={dropBall} disabled={!canDrop()}>落とす</Button>
    <Button color="alternative" onclick={resetBall}>リセット</Button>
    <Button color="light" onclick={nextStage}>次の問題</Button>
  </div>
  {#if blockedByOverlap}
    <Helper color="red">数式の線が玉と重なっています。線を調整してください。</Helper>
  {/if}
</div>
