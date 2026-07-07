<script lang="ts">
  import { Alert, Button } from 'flowbite-svelte';
  import { game, nextStage } from '../lib/gameState.svelte';
</script>

{#if game.cleared}
  <Alert color="green" border>
    <div class="flex items-center justify-between gap-4">
      <span class="font-semibold">クリア！ 全ての通過点を通過しました。</span>
      <Button size="sm" color="green" onclick={nextStage}>次の問題へ</Button>
    </div>
  </Alert>
{/if}
