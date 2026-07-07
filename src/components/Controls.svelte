<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { game, dropBall, resetBall, nextStage } from '../lib/gameState.svelte';
</script>

<div class="flex flex-wrap gap-2">
  <Button color="primary" onclick={dropBall} disabled={game.ball.mode !== 'idle'}>落とす</Button>
  <Button color="alternative" onclick={resetBall}>リセット</Button>
  <Button color="light" onclick={nextStage}>次の問題</Button>
</div>
